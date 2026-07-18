import { Router } from 'express'
import { listUsersController, loginController, registerController } from '../controllers/authController.js'

const router = Router()

router.post('/login', loginController)
router.post('/register', registerController)
router.get('/users', listUsersController)

export default router
