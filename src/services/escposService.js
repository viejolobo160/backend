/**
 * Servicio ESC/POS para impresoras térmicas XPrinter XP-58
 * Genera comandos ESC/POS directamente para impresoras térmicas
 */

class EscposService {
  constructor() {
    this.ESC = '\x1B'
    this.GS = '\x1D'
    this.LF = '\x0A'
    this.FF = '\x0C'
    this.NUL = '\x00'
  }

  /**
   * Inicializa la impresora
   */
  initialize() {
    let commands = ''
    commands += this.ESC + '@' // Comando de reset (ESC @)
    commands += this.ESC + '!' + String.fromCharCode(0) // Fuente normal
    commands += this.ESC + 'a' + String.fromCharCode(0) // Alinear a la izquierda
    return commands
  }

  /**
   * Establece alineación de texto
   * align: 0 = izquierda, 1 = centro, 2 = derecha
   */
  setAlignment(align = 0) {
    return this.ESC + 'a' + String.fromCharCode(align)
  }

  /**
   * Activa/desactiva modo bold
   */
  setBold(enable = true) {
    if (enable) {
      return this.ESC + 'E' + String.fromCharCode(1)
    } else {
      return this.ESC + 'E' + String.fromCharCode(0)
    }
  }

  /**
   * Establece tamaño de fuente
   * width: 1-8, height: 1-8
   */
  setFontSize(width = 1, height = 1) {
    const size = (width - 1) * 16 + (height - 1)
    return this.GS + '!' + String.fromCharCode(size)
  }

  /**
   * Imprime una línea de texto
   */
  printLine(text = '') {
    return text + this.LF
  }

  /**
   * Imprime una línea centrada
   */
  printCenterLine(text = '') {
    return this.setAlignment(1) + this.printLine(text) + this.setAlignment(0)
  }

  /**
   * Imprime una línea con dos columnas (nombre + precio alineado a derecha)
   */
  printLineWithPrice(description, price, width = 32) {
    const descLength = description.length
    const priceStr = String(price).trim()
    const spacesNeeded = width - descLength - priceStr.length
    const spaces = ' '.repeat(Math.max(1, spacesNeeded))
    return this.printLine(description + spaces + priceStr)
  }

  /**
   * Imprime un separador punteado
   */
  printSeparator(width = 32) {
    return this.printLine(''.padEnd(width, '-'))
  }

  /**
   * Imprime un salto de línea
   */
  newLine(count = 1) {
    return this.LF.repeat(count)
  }

  /**
   * Realiza un corte de papel
   */
  cutPaper() {
    return this.GS + 'V' + String.fromCharCode(66) + String.fromCharCode(0)
  }

  /**
   * Abre el cajón (opcional)
   */
  openDrawer() {
    return this.ESC + 'p' + String.fromCharCode(0) + String.fromCharCode(100) + String.fromCharCode(100)
  }

  /**
   * Genera el ticket completo en ESC/POS
   */
  generateTicket(saleData, businessConfig, ticketConfig) {
    const { sale, items, customer } = saleData
    let ticket = ''

    // 1. Inicializar impresora
    ticket += this.initialize()

    // 2. Encabezado - Nombre del negocio
    ticket += this.setAlignment(1) // Centro
    if (ticketConfig.show_business_name !== false) {
      ticket += this.setBold(true)
      ticket += this.printCenterLine(this.truncateText(businessConfig.business_name || 'VIEJO LOBO', 32))
      ticket += this.setBold(false)
    }

    // 3. Datos del negocio
    if (ticketConfig.show_address && businessConfig.business_address) {
      ticket += this.printCenterLine(this.truncateText(businessConfig.business_address, 32))
    }

    if (ticketConfig.show_phone && businessConfig.business_phone) {
      ticket += this.printCenterLine(this.truncateText(businessConfig.business_phone, 32))
    }

    if (ticketConfig.show_email && businessConfig.business_email) {
      ticket += this.printCenterLine(this.truncateText(businessConfig.business_email, 32))
    }

    // 4. Separador
    ticket += this.setAlignment(1)
    ticket += this.printSeparator(32)

    // 5. Información del ticket
    ticket += this.setAlignment(0) // Izquierda
    ticket += this.printLine('TICKET #' + sale.id)
    ticket += this.printLine('Fecha: ' + this.formatDate(sale.created_at))
    ticket += this.printLine('Hora: ' + this.formatTime(sale.created_at))

    if (ticketConfig.show_salesperson && sale.salesperson) {
      ticket += this.printLine('Vendedor: ' + sale.salesperson)
    }

    // 6. Datos del cliente
    if (customer && customer.customer_name) {
      ticket += this.printLine('Cliente: ' + this.truncateText(customer.customer_name, 28))
    }

    // 7. Separador
    ticket += this.printSeparator(32)

    // 8. Encabezados de la tabla
    ticket += this.printLine('DETALLE DE COMPRA')
    ticket += this.printSeparator(32)

    // 9. Items
    for (const item of items) {
      // Nombre del producto (truncado si es muy largo)
      const productName = this.truncateText(item.product_name || 'Producto', 24)
      ticket += this.printLine(productName)

      // Cantidad x Precio = Subtotal
      const qty = item.quantity || 1
      const price = item.unit_price || 0
      const subtotal = item.total_amount || 0

      const qtyStr = qty.toString().padStart(3)
      const priceStr = this.formatCurrency(price).padStart(7)
      const subtotalStr = this.formatCurrency(subtotal).padStart(7)

      ticket += this.printLine(
        'Cant: ' + qtyStr + ' x ' + priceStr + ' = ' + subtotalStr
      )
    }

    // 10. Separador
    ticket += this.printSeparator(32)

    // 11. Totales
    ticket += this.setBold(true)
    const subtotalLine = 'Subtotal:' + ' '.repeat(23 - 'Subtotal:'.length - this.formatCurrency(sale.subtotal || 0).length) + this.formatCurrency(sale.subtotal || 0)
    ticket += this.printLine(subtotalLine)

    if (ticketConfig.show_taxes && (sale.tax_amount || 0) > 0) {
      const taxLine = 'Impuesto:' + ' '.repeat(23 - 'Impuesto:'.length - this.formatCurrency(sale.tax_amount || 0).length) + this.formatCurrency(sale.tax_amount || 0)
      ticket += this.printLine(taxLine)
    }

    const totalLine = 'TOTAL:' + ' '.repeat(26 - 'TOTAL:'.length - this.formatCurrency(sale.total_amount || 0).length) + this.formatCurrency(sale.total_amount || 0)
    ticket += this.printLine(totalLine)
    ticket += this.setBold(false)

    // 12. Forma de pago
    ticket += this.printSeparator(32)
    if (sale.payment_method) {
      ticket += this.printLine('Forma de Pago: ' + sale.payment_method)
    }

    // 13. Mensaje de agradecimiento
    ticket += this.newLine(1)
    ticket += this.setAlignment(1)
    ticket += this.setBold(true)
    if (ticketConfig.footer_message) {
      const footerLines = this.wrapText(ticketConfig.footer_message, 32)
      for (const line of footerLines) {
        ticket += this.printCenterLine(line)
      }
    } else {
      ticket += this.printCenterLine('¡GRACIAS POR SU COMPRA!')
    }
    ticket += this.setBold(false)

    // 14. Separador final
    ticket += this.setAlignment(1)
    ticket += this.printSeparator(32)

    // 15. Fecha y hora final (opcional)
    if (ticketConfig.show_final_message) {
      ticket += this.printCenterLine('Vuelva Pronto')
    }

    // 16. Saltos de línea para separar tickets
    ticket += this.newLine(3)

    // 17. Corte de papel (opcional)
    if (ticketConfig.auto_cut) {
      ticket += this.cutPaper()
    }

    return ticket
  }

  /**
   * Formatea currency
   */
  formatCurrency(value) {
    return '$' + (parseFloat(value) || 0).toFixed(2).replace('.', ',')
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    })
  }

  /**
   * Formatea la hora
   */
  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * Trunca texto a una longitud máxima
   */
  truncateText(text, maxLength = 32) {
    if (!text) return ''
    text = text.toString()
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...'
    }
    return text
  }

  /**
   * Envuelve texto en múltiples líneas
   */
  wrapText(text, maxWidth = 32) {
    if (!text) return []
    const words = text.split(' ')
    const lines = []
    let currentLine = ''

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines
  }
}

export default new EscposService()
