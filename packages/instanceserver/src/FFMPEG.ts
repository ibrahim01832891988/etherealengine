/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import Process from 'child_process'
import ffmpeg from 'ffmpeg-static'
import Stream from 'stream'

import serverLogger from '@etherealengine/server-core/src/ServerLogger'

const logger = serverLogger.child({ module: 'instanceserver:FFMPEG' })

/**
 * @todo
 *
 *  - support more codecs and get codec data from the producer directly
 * - support more than one ffmpeg at the same time by specifying different ports
 */

/**
 * Complete list of ffmpeg flags
 * https://gist.github.com/tayvano/6e2d456a9897f55025e25035478a3a50
 */

/**
 *
 * @param useAudio
 * @param useVideo
 * @param onExit
 * @param useH264
 * @returns
 */
export const startFFMPEG = async (useAudio: boolean, useVideo: boolean, onExit: () => void, useH264: boolean) => {
  // require on demand as not to unnecessary slow down instance server
  if (!ffmpeg) throw new Error('FFmpeg not found')

  // Ensure correct FFmpeg version is installed
  const ffmpegOut = Process.execSync(ffmpeg + ' -version', {
    encoding: 'utf8'
  })
  const ffmpegVerMatch = /ffmpeg version (\d+)\.(\d+)\.(\d+)/.exec(ffmpegOut)
  let ffmpegOk = false
  if (ffmpegOut.startsWith('ffmpeg version git')) {
    // Accept any Git build (it's up to the developer to ensure that a recent
    // enough version of the FFmpeg source code has been built)
    ffmpegOk = true
  } else if (ffmpegVerMatch) {
    const ffmpegVerMajor = parseInt(ffmpegVerMatch[1], 10)
    if (ffmpegVerMajor >= 4) {
      ffmpegOk = true
    }
  }

  const stream = new Stream.PassThrough()

  if (!ffmpegOk) {
    throw new Error('FFmpeg >= 4.0.0 not found in $PATH; please install it')
  }

  /** Init codec & args */

  let cmdInputPath = `${__dirname}/recording/input-vp8.sdp`
  let cmdOutputPath = `${__dirname}/recording/output-ffmpeg-vp8.webm`
  let cmdCodec = ''
  let cmdFormat = '-f webm -flags +global_header'

  if (useAudio) {
    cmdCodec += ' -map 0:a:0 -c:a copy'
  }
  if (useVideo) {
    cmdCodec += ' -map 0:v:0 -c:v copy'

    if (useH264) {
      cmdInputPath = `${__dirname}/recording/input-h264.sdp`
      cmdOutputPath = `${__dirname}/recording/output-ffmpeg-h264.mp4`

      // "-strict experimental" is required to allow storing
      // OPUS audio into MP4 container
      cmdFormat = '-f mp4 -strict experimental'
    }
  }

  // Run process
  const cmdArgStr = [
    '-nostdin',
    '-protocol_whitelist file,rtp,udp',
    '-analyzeduration 10M',
    '-probesize 10M',
    '-fflags +genpts',
    `-i ${cmdInputPath}`,
    cmdCodec,
    cmdFormat,
    `-y pipe:1`
  ]
    .join(' ')
    .trim()

  logger.info(`Run command: ${ffmpeg} ${cmdArgStr}`)

  const childProcess = Process.spawn(ffmpeg, cmdArgStr.split(/\s+/))

  childProcess.on('error', (err) => {
    logger.error('Recording process error:', err)
  })

  childProcess.on('data', (chunk) => {
    console.log(chunk)
  })

  childProcess.on('exit', (code, signal) => {
    logger.info('Recording process exit, code: %d, signal: %s', code, signal)

    onExit()

    if (!signal || signal === 'SIGINT') {
      logger.info('Recording stopped')
    } else {
      logger.warn("Recording process didn't exit cleanly, output file might be corrupt")
    }
  })

  const stop = () => {
    childProcess.kill('SIGINT')
  }
  childProcess.stdout.pipe(stream, { end: true })

  await new Promise<void>((resolve, reject) => {
    // FFmpeg writes its logs to stderr
    childProcess.stderr.on('data', (chunk) => {
      chunk
        .toString()
        .split(/\r?\n/g)
        .filter(Boolean) // Filter out empty strings
        .forEach((line) => {
          logger.info(line)
          if (line.startsWith('ffmpeg version')) {
            setTimeout(() => {
              resolve()
            }, 1000)
          }
        })
    })
  })

  return {
    childProcess,
    stop,
    stream
  }
}
