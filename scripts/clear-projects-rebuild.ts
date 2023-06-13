import appRootPath from 'app-root-path'
import cli from 'cli'
/* eslint-disable @typescript-eslint/no-var-requires */
import dotenv from 'dotenv-flow'
import Sequelize from 'sequelize'

dotenv.config({
  path: appRootPath.path,
  silent: true
})

const db = {
  username: process.env.MYSQL_USER ?? 'server',
  password: process.env.MYSQL_PASSWORD ?? 'password',
  database: process.env.MYSQL_DATABASE ?? 'etherealengine',
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: process.env.MYSQL_PORT ?? 3306,
  dialect: 'mysql',
  url: ''
}

db.url = process.env.MYSQL_URL ?? `mysql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`

cli.enable('status')

cli.main(async () => {
  try {
    const sequelizeClient = new Sequelize({
      ...db,
      logging: console.log,
      define: {
        freezeTableName: true
      }
    })

    await sequelizeClient.sync()

    const Project = sequelizeClient.define('project', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.DataTypes.STRING
      },
      thumbnail: {
        type: Sequelize.DataTypes.STRING
      },
      repositoryPath: {
        type: Sequelize.DataTypes.STRING
      },
      settings: {
        type: Sequelize.DataTypes.TEXT
      },
      needsRebuild: {
        type: Sequelize.DataTypes.BOOLEAN
      },
      commitSHA: {
        type: Sequelize.DataTypes.STRING
      }
    })

    await Project.update(
      {
        needsRebuild: false
      },
      { where: {} }
    )

    cli.ok(`Projects needsRebuild set to false`)

    process.exit(0)
  } catch (err) {
    console.log(err)
    cli.fatal(err)
  }
})
