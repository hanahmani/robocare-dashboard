const META_WHATSAPP_TEMPLATES = [
  {
    id: '1651186349464907',
    name: 'rapo',
    channel: 'WhatsApp',
    language: 'en_US',
    status: 'APPROVED',
    category: 'UTILITY',
    subCategory: 'CUSTOM',
    isPrimaryDeviceDeliveryOnly: false,
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '{{1}}',
        example: {
          header_text: ['Your Agricultural Report is Ready'],
        },
      },
      {
        type: 'BODY',
        text: 'Hello {{1}}. \n{{2}} \nhave a nice day',
        example: {
          body_text: [['Imen Hbiri', 'Your agricultural report for field A12 is ready. Soil humidity is 62%.']],
        },
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View details',
            url: 'https://app.satellite.robocare.tn/{{1}}',
            example: ['https://app.satellite.robocare.tn/'],
          },
        ],
      },
    ],
  },
  {
    id: '2014021822801533',
    name: 'land_report',
    channel: 'WhatsApp',
    language: 'en_US',
    status: 'APPROVED',
    category: 'UTILITY',
    subCategory: 'CUSTOM',
    isPrimaryDeviceDeliveryOnly: false,
    components: [
      {
        type: 'BODY',
        text: 'Hello {{1}}. \n{{2}} \nhave a nice day',
        example: {
          body_text: [['Imene Hbiri', 'here is a report exemple']],
        },
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'URL',
            text: 'View Report',
            url: 'https://app.satellite.robocare.tn/media/pdf_report_files/524/Rapport_de_suivi_Avril_2026-2026-04-23.pdf{{1}}',
            example: ['https://app.satellite.robocare.tn/media/'],
          },
        ],
      },
    ],
  },
  {
    id: '1296014669068516',
    name: 'hello_world',
    channel: 'WhatsApp',
    language: 'en_US',
    status: 'APPROVED',
    category: 'UTILITY',
    isPrimaryDeviceDeliveryOnly: false,
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Hello World',
      },
      {
        type: 'BODY',
        text: 'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.',
      },
      {
        type: 'FOOTER',
        text: 'WhatsApp Business Platform sample message',
      },
    ],
  },
]

function countPlaceholders(text = '') {
  const matches = [...String(text).matchAll(/\{\{(\d+)\}\}/g)]
  if (matches.length === 0) return 0
  return Math.max(...matches.map((match) => Number(match[1] || 0)))
}

function getExampleValues(component, fallbackCount) {
  if (component.type === 'HEADER') {
    const headerExample = component.example?.header_text?.[0]
    return Array.isArray(headerExample) ? headerExample : [headerExample].filter(Boolean)
  }

  if (component.type === 'BODY') {
    return component.example?.body_text?.[0] || Array.from({ length: fallbackCount }, () => '')
  }

  if (component.type === 'BUTTONS') {
    return component.buttons?.[0]?.example || Array.from({ length: fallbackCount }, () => '')
  }

  return Array.from({ length: fallbackCount }, () => '')
}

export function getMetaWhatsAppTemplates() {
  return META_WHATSAPP_TEMPLATES
}

export function findMetaWhatsAppTemplate(name) {
  return META_WHATSAPP_TEMPLATES.find((template) => template.name === name) || null
}

export function getWhatsAppTemplateParameterSchema(template) {
  if (!template) return []

  const fields = []

  template.components.forEach((component) => {
    if (component.type === 'BUTTONS') {
      component.buttons?.forEach((button, buttonIndex) => {
        const count = countPlaceholders(button.url || button.text || '')
        for (let index = 1; index <= count; index += 1) {
          fields.push({
            key: `button-${buttonIndex + 1}-${index}`,
            componentType: 'BUTTONS',
            label: `Button ${buttonIndex + 1} URL param ${index}`,
            placeholder: `Value for button ${buttonIndex + 1} placeholder ${index}`,
            defaultValue: button.example?.[index - 1] || '',
          })
        }
      })
      return
    }

    if (!['HEADER', 'BODY'].includes(component.type)) return

    const count = countPlaceholders(component.text || '')
    const exampleValues = getExampleValues(component, count)

    for (let index = 1; index <= count; index += 1) {
      fields.push({
        key: `${component.type.toLowerCase()}-${index}`,
        componentType: component.type,
        label: `${component.type} param ${index}`,
        placeholder: `Value for ${component.type.toLowerCase()} placeholder ${index}`,
        defaultValue: exampleValues[index - 1] || '',
      })
    }
  })

  return fields
}

export function buildWhatsAppTemplatePayload(template, values) {
  const schema = getWhatsAppTemplateParameterSchema(template)
  const grouped = schema.reduce(
    (acc, field) => {
      const value = values[field.key] || ''
      if (field.componentType === 'HEADER') acc.header.push(value)
      if (field.componentType === 'BODY') acc.body.push(value)
      if (field.componentType === 'BUTTONS') acc.buttons.push(value)
      return acc
    },
    { header: [], body: [], buttons: [] },
  )

  return {
    templateName: template?.name || '',
    languageCode: template?.language || 'en_US',
    headerParameters: grouped.header,
    bodyParameters: grouped.body,
    buttonUrlSuffix: grouped.buttons[0] || '',
    templateParameters: values,
  }
}

export function buildLandReportPayload({ to, message, bodyText, fileUrl, templateLang = 'en_US' }) {
  return {
    to,
    message,
    type: 'TEMPLATE',
    templateName: 'land_report',
    templateLang,
    bodyText,
    fileUrl,
  }
}

export function buildRapoPayload({
  to,
  message,
  headerText,
  bodyText,
  fileUrl,
  templateLang = 'en_US',
}) {
  return {
    to,
    type: 'TEMPLATE',
    message,
    headerText,
    bodyText,
    templateName: 'rapo',
    templateLang,
    fileUrl,
  }
}
