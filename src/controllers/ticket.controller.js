import { executeQuery } from "../config/database.js"
import escposService from "../services/escposService.js"

// Obtener configuración del negocio
export const getBusinessConfig = async (req, res) => {
  try {
    const businessConfig = await executeQuery(
      "SELECT * FROM business_config ORDER BY id DESC LIMIT 1"
    )

    if (businessConfig.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuración del negocio no encontrada",
        code: "BUSINESS_CONFIG_NOT_FOUND"
      })
    }

    res.json({
      success: true,
      data: businessConfig[0]
    })
  } catch (error) {
    console.error("Error obteniendo configuración del negocio:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener configuración del negocio",
      code: "BUSINESS_CONFIG_ERROR"
    })
  }
}

// Actualizar configuración del negocio
export const updateBusinessConfig = async (req, res) => {
  try {
    const {
      business_name,
      business_address,
      business_phone,
      business_email,
      business_cuit,
      business_website,
      business_logo,
      business_slogan,
      business_footer_message
    } = req.body

    // Validar que al menos el nombre del negocio esté presente
    if (!business_name || business_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre del negocio es requerido",
        code: "BUSINESS_NAME_REQUIRED"
      })
    }

    // Verificar si existe configuración
    const existingConfig = await executeQuery(
      "SELECT id FROM business_config LIMIT 1"
    )

    if (existingConfig.length === 0) {
      // Crear nueva configuración
      await executeQuery(
        `INSERT INTO business_config (
          business_name, business_address, business_phone, business_email,
          business_cuit, business_website, business_logo, business_slogan,
          business_footer_message, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          business_name,
          business_address || null,
          business_phone || null,
          business_email || null,
          business_cuit || null,
          business_website || null,
          business_logo || null,
          business_slogan || null,
          business_footer_message || null
        ]
      )
    } else {
      // Actualizar configuración existente
      await executeQuery(
        `UPDATE business_config SET
          business_name = ?,
          business_address = ?,
          business_phone = ?,
          business_email = ?,
          business_cuit = ?,
          business_website = ?,
          business_logo = ?,
          business_slogan = ?,
          business_footer_message = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          business_name,
          business_address || null,
          business_phone || null,
          business_email || null,
          business_cuit || null,
          business_website || null,
          business_logo || null,
          business_slogan || null,
          business_footer_message || null,
          existingConfig[0].id
        ]
      )
    }

    // Obtener configuración actualizada
    const updatedConfig = await executeQuery(
      "SELECT * FROM business_config ORDER BY id DESC LIMIT 1"
    )

    res.json({
      success: true,
      message: "Configuración del negocio actualizada correctamente",
      data: updatedConfig[0]
    })
  } catch (error) {
    console.error("Error actualizando configuración del negocio:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar configuración del negocio",
      code: "BUSINESS_CONFIG_UPDATE_ERROR"
    })
  }
}

// Obtener configuración de tickets
export const getTicketConfig = async (req, res) => {
  try {
    const ticketConfig = await executeQuery(
      "SELECT * FROM ticket_config ORDER BY id DESC LIMIT 1"
    )

    if (ticketConfig.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuración de tickets no encontrada",
        code: "TICKET_CONFIG_NOT_FOUND"
      })
    }

    res.json({
      success: true,
      data: ticketConfig[0]
    })
  } catch (error) {
    console.error("Error obteniendo configuración de tickets:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener configuración de tickets",
      code: "TICKET_CONFIG_ERROR"
    })
  }
}

// Actualizar configuración de tickets
export const updateTicketConfig = async (req, res) => {
  try {
    const {
      enable_print,
      auto_print,
      printer_name,
      paper_width,
      show_logo,
      show_business_info,
      show_cuit,
      show_barcode,
      show_qr,
      font_size,
      print_duplicate,
      copies_count,
      header_message,
      footer_message,
      return_policy,
      show_cashier,
      show_customer,
      show_payment_method,
      show_change,
      fiscal_type,
      show_tax_breakdown,
      include_cae
    } = req.body

    // Validar valores
    if (paper_width && ![58, 80].includes(Number(paper_width))) {
      return res.status(400).json({
        success: false,
        message: "Ancho de papel inválido. Debe ser 58mm o 80mm",
        code: "INVALID_PAPER_WIDTH"
      })
    }

    if (font_size && !['small', 'normal', 'large'].includes(font_size)) {
      return res.status(400).json({
        success: false,
        message: "Tamaño de fuente inválido",
        code: "INVALID_FONT_SIZE"
      })
    }

    if (fiscal_type && !['TICKET', 'FACTURA_A', 'FACTURA_B', 'FACTURA_C'].includes(fiscal_type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo fiscal inválido",
        code: "INVALID_FISCAL_TYPE"
      })
    }

    // Verificar si existe configuración
    const existingConfig = await executeQuery(
      "SELECT id FROM ticket_config LIMIT 1"
    )

    if (existingConfig.length === 0) {
      // Crear nueva configuración
      await executeQuery(
        `INSERT INTO ticket_config (
          enable_print, auto_print, printer_name, paper_width,
          show_logo, show_business_info, show_cuit, show_barcode, show_qr,
          font_size, print_duplicate, copies_count,
          header_message, footer_message, return_policy,
          show_cashier, show_customer, show_payment_method, show_change,
          fiscal_type, show_tax_breakdown, include_cae,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          enable_print ?? true,
          auto_print ?? false,
          printer_name || null,
          paper_width || 80,
          show_logo ?? true,
          show_business_info ?? true,
          show_cuit ?? true,
          show_barcode ?? false,
          show_qr ?? false,
          font_size || 'normal',
          print_duplicate ?? false,
          copies_count || 1,
          header_message || null,
          footer_message || null,
          return_policy || null,
          show_cashier ?? true,
          show_customer ?? true,
          show_payment_method ?? true,
          show_change ?? true,
          fiscal_type || 'TICKET',
          show_tax_breakdown ?? true,
          include_cae ?? false
        ]
      )
    } else {
      // Actualizar configuración existente
      await executeQuery(
        `UPDATE ticket_config SET
          enable_print = ?,
          auto_print = ?,
          printer_name = ?,
          paper_width = ?,
          show_logo = ?,
          show_business_info = ?,
          show_cuit = ?,
          show_barcode = ?,
          show_qr = ?,
          font_size = ?,
          print_duplicate = ?,
          copies_count = ?,
          header_message = ?,
          footer_message = ?,
          return_policy = ?,
          show_cashier = ?,
          show_customer = ?,
          show_payment_method = ?,
          show_change = ?,
          fiscal_type = ?,
          show_tax_breakdown = ?,
          include_cae = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          enable_print ?? true,
          auto_print ?? false,
          printer_name || null,
          paper_width || 80,
          show_logo ?? true,
          show_business_info ?? true,
          show_cuit ?? true,
          show_barcode ?? false,
          show_qr ?? false,
          font_size || 'normal',
          print_duplicate ?? false,
          copies_count || 1,
          header_message || null,
          footer_message || null,
          return_policy || null,
          show_cashier ?? true,
          show_customer ?? true,
          show_payment_method ?? true,
          show_change ?? true,
          fiscal_type || 'TICKET',
          show_tax_breakdown ?? true,
          include_cae ?? false,
          existingConfig[0].id
        ]
      )
    }

    // Obtener configuración actualizada
    const updatedConfig = await executeQuery(
      "SELECT * FROM ticket_config ORDER BY id DESC LIMIT 1"
    )

    res.json({
      success: true,
      message: "Configuración de tickets actualizada correctamente",
      data: updatedConfig[0]
    })
  } catch (error) {
    console.error("Error actualizando configuración de tickets:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar configuración de tickets",
      code: "TICKET_CONFIG_UPDATE_ERROR"
    })
  }
}

// Obtener toda la configuración (negocio + tickets) en una sola llamada
export const getAllConfig = async (req, res) => {
  try {
    const [businessConfig, ticketConfig] = await Promise.all([
      executeQuery("SELECT * FROM business_config ORDER BY id DESC LIMIT 1"),
      executeQuery("SELECT * FROM ticket_config ORDER BY id DESC LIMIT 1")
    ])

    res.json({
      success: true,
      data: {
        business: businessConfig[0] || null,
        ticket: ticketConfig[0] || null
      }
    })
  } catch (error) {
    console.error("Error obteniendo configuración completa:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener configuración",
      code: "CONFIG_ERROR"
    })
  }
}

// Generar ESC/POS
export const printTicketEscpos = async (req, res) => {
  try {
    const { saleId, businessConfig, ticketConfig } = req.body

    // Validar que se proporcionaron los datos necesarios
    if (!saleId || !businessConfig || !ticketConfig) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos para generar el ticket ESC/POS",
        code: "MISSING_TICKET_DATA"
      })
    }

    // Obtener datos de la venta (incluir cliente e items)
    const saleQuery = `
      SELECT s.*, c.customer_name, c.customer_phone 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `
    const saleData = await executeQuery(saleQuery, [saleId])

    if (saleData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
        code: "SALE_NOT_FOUND"
      })
    }

    // Obtener items de la venta
    const itemsQuery = `
      SELECT si.*, p.product_name 
      FROM sale_items si 
      JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `
    const items = await executeQuery(itemsQuery, [saleId])

    // Preparar datos del ticket
    const ticketData = {
      sale: saleData[0],
      items: items,
      customer: saleData[0]
    }

    // Generar comandos ESC/POS
    const escposCommands = escposService.generateTicket(
      ticketData,
      businessConfig,
      ticketConfig
    )

    // Retornar los comandos como base64 para que el frontend pueda enviarlos a la impresora
    res.json({
      success: true,
      data: {
        commands: Buffer.from(escposCommands).toString('base64'),
        message: "Comandos ESC/POS generados exitosamente"
      }
    })
  } catch (error) {
    console.error("Error generando ESC/POS:", error)
    res.status(500).json({
      success: false,
      message: "Error al generar comandos de impresión",
      code: "ESCPOS_GENERATION_ERROR",
      error: error.message
    })
  }
}
