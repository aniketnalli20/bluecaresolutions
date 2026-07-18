import { Router } from 'express'
import { getWorkspaceController, saveWorkspaceController } from '../controllers/workspaceController.js'

const router = Router()

router.get('/', getWorkspaceController)
router.put('/', saveWorkspaceController)

export default router
