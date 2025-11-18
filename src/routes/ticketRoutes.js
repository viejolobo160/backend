import express from "express"
import {
  getBusinessConfig,
  updateBusinessConfig,
  getTicketConfig,
  updateTicketConfig,
  getAllConfig,
  generateThermalPDF
} from "../controllers/ticket.controller.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

router.use(authenticateToken)

// Rutas de configuración del negocio
router.get("/business", getBusinessConfig)
router.put("/business", updateBusinessConfig)

// Rutas de configuración de tickets
router.get("/ticket", getTicketConfig)
router.put("/ticket", updateTicketConfig)

// Ruta para obtener toda la configuración
router.get("/all", getAllConfig)

router.post("/ticket/generate-pdf", generateThermalPDF)

export default router
