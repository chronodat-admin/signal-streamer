// Spanish translations
import type { TranslationKeys } from './en';

export const es: TranslationKeys = {
  // Common
  common: {
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    add: 'Agregar',
    remove: 'Quitar',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Actualizar',
    copy: 'Copiar',
    copied: '¡Copiado!',
    close: 'Cerrar',
    confirm: 'Confirmar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    viewAll: 'Ver Todo',
    noData: 'No hay datos disponibles',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    yes: 'Sí',
    no: 'No',
    enabled: 'Habilitado',
    disabled: 'Deshabilitado',
    active: 'Activo',
    inactive: 'Inactivo',
    all: 'Todos',
    none: 'Ninguno',
    unknown: 'Desconocido',
    optional: 'Opcional',
    required: 'Requerido',
  },

  // Navigation
  nav: {
    dashboard: 'Panel',
    signals: 'Señales',
    strategies: 'Estrategias',
    alertLogs: 'Registro de Alertas',
    apiKeys: 'Claves API',
    integrations: 'Integraciones',
    billing: 'Facturación',
    preferences: 'Preferencias',
    signOut: 'Cerrar Sesión',
    adminPanel: 'Panel Admin',
  },

  // Dashboard Page
  dashboard: {
    title: 'Panel',
    subtitle: 'Rastrea y gestiona tus señales de trading',
    newStrategy: 'Nueva Estrategia',
    
    // Stats
    totalPnL: 'P&G Total',
    closedTrades: 'operaciones cerradas',
    winRate: 'Tasa de Éxito',
    wins: 'victorias',
    noTrades: 'Sin operaciones',
    signalsToday: 'Señales Hoy',
    last24Hours: 'Últimas 24 horas',
    thisWeek: 'Esta Semana',
    last7Days: 'Últimos 7 días',
    strategies: 'Estrategias',
    activeStrategies: 'Estrategias activas',
    topSymbol: 'Símbolo Principal',
    mostSignals: 'Más señales',
    openPositions: 'Posiciones Abiertas',
    activeTrades: 'Operaciones activas',
    bestTrade: 'Mejor Operación',
    topPerformer: 'Mayor rendimiento',

    // Tables
    openTrades: 'Operaciones Abiertas',
    closedTrades: 'Operaciones Cerradas',
    direction: 'Dirección',
    symbol: 'Símbolo',
    entryPrice: 'Precio de Entrada',
    exitPrice: 'Precio de Salida',
    current: 'Actual',
    pnl: 'P&G',
    strategy: 'Estrategia',
    entryTime: 'Hora de Entrada',
    time: 'Hora',
    long: 'LARGO',
    short: 'CORTO',
  },

  // Signals Page
  signals: {
    title: 'Todas las Señales',
    subtitle: 'Ver y filtrar todas tus señales de trading',
    addSignal: 'Agregar Señal',
    exportCSV: 'Exportar CSV',
    
    // Stats
    totalSignals: 'Total de Señales',
    buySignals: 'Señales de COMPRA',
    sellSignals: 'Señales de VENTA',
    potentialDuplicates: 'Posibles Duplicados',

    // Filters
    filters: 'Filtros',
    filterDescription: 'Filtrar señales por estrategia, símbolo o tipo',
    searchSignals: 'Buscar señales...',
    allStrategies: 'Todas las Estrategias',
    filterBySymbol: 'Filtrar por símbolo...',
    allTypes: 'Todos los Tipos',
    buyLong: 'COMPRA/LARGO',
    sellShort: 'VENTA/CORTO',

    // Table
    dateTime: 'Fecha y Hora',
    signal: 'Señal',
    price: 'Precio',
    source: 'Fuente',

    // Manual Signal Dialog
    addManualSignal: 'Agregar Señal Manual',
    manualSignalDescription: 'Ingresa una señal manualmente para rastrear tus operaciones. Funciona igual que las señales de TradingView.',
    selectStrategy: 'Selecciona una estrategia',
    noStrategiesFound: 'No se encontraron estrategias. Crea una estrategia primero.',
    signalType: 'Tipo de Señal',
    selectSignalType: 'Selecciona tipo de señal',
    buyLongEntry: 'COMPRA (Entrada Larga)',
    sellShortEntry: 'VENTA (Entrada Corta / Salir Largo)',
    longOpenPosition: 'LARGO (Abrir Posición Larga)',
    shortOpenPosition: 'CORTO (Abrir Posición Corta)',
    closePosition: 'CERRAR (Cerrar Posición)',
    symbolPlaceholder: 'ej., AAPL, BTCUSD',
    pricePlaceholder: 'ej., 150.25',
    signalTime: 'Hora de la Señal',
    signalTimeDescription: '¿Cuándo ocurrió esta señal? Por defecto es ahora.',
    notes: 'Notas',
    notesPlaceholder: 'ej., RSI sobrevendido, nivel de soporte',
    adding: 'Agregando...',

    // Toast messages
    signalAdded: 'Señal Agregada',
    signalAddedDescription: 'Señal manual de {type} para {symbol} agregada exitosamente',
    exported: 'Exportado',
    signalsExported: 'Señales exportadas a CSV',
    validationError: 'Error de Validación',
    pleaseSelectStrategy: 'Por favor selecciona una estrategia',
    pleaseSelectSignalType: 'Por favor selecciona un tipo de señal',
    pleaseEnterSymbol: 'Por favor ingresa un símbolo',
    pleaseEnterValidPrice: 'Por favor ingresa un precio válido',
    failedToAddSignal: 'Error al agregar señal',
    failedToLoadSignals: 'Error al cargar señales',
  },

  // Strategies Page
  strategies: {
    title: 'Estrategias',
    subtitle: 'Gestiona tus estrategias de trading',
    newStrategy: 'Nueva Estrategia',
    
    // Stats
    totalStrategies: 'Total de Estrategias',
    publicStrategies: 'Públicas',
    totalSignals: 'Total de Señales',
    last7Days: 'Últimos 7 días',
    lastSignal: 'Última Señal',
    neverReceived: 'Nunca recibida',
    receivedAgo: 'hace {time}',

    // Table
    name: 'Nombre',
    visibility: 'Visibilidad',
    signals: 'Señales',
    status: 'Estado',
    actions: 'Acciones',
    public: 'Pública',
    private: 'Privada',
    configured: 'Configurada',
    pendingSetup: 'Pendiente de Configurar',
    viewDetails: 'Ver Detalles',
    copyWebhook: 'Copiar Webhook',
    deleteStrategy: 'Eliminar Estrategia',
    
    // Create Dialog
    createStrategy: 'Crear Estrategia',
    createStrategyDescription: 'Configura una nueva estrategia para recibir señales de TradingView',
    strategyName: 'Nombre de la Estrategia',
    strategyNamePlaceholder: 'ej., RSI Momentum',
    description: 'Descripción',
    descriptionPlaceholder: 'Breve descripción de tu estrategia',
    publicStrategy: 'Estrategia Pública',
    publicStrategyDescription: 'Permitir que otros vean esta estrategia',
    creating: 'Creando...',

    // Toast messages
    strategyCreated: 'Estrategia Creada',
    strategyCreatedDescription: 'Tu estrategia ha sido creada exitosamente',
    webhookCopied: 'URL del webhook copiada al portapapeles',
    strategyDeleted: 'Estrategia Eliminada',
    strategyDeletedDescription: 'La estrategia ha sido eliminada',
    failedToCreate: 'Error al crear estrategia',
    failedToDelete: 'Error al eliminar estrategia',
  },

  // Strategy Detail Page
  strategyDetail: {
    back: 'Atrás',
    signals: 'Señales',
    setup: 'Configuración',
    analytics: 'Analíticas',
    
    // Setup Tab
    webhookUrl: 'URL del Webhook',
    webhookDescription: 'Usa esta URL en las alertas de TradingView para enviar señales a esta estrategia',
    copyUrl: 'Copiar URL',
    alertMessageFormat: 'Formato del Mensaje de Alerta',
    alertFormatDescription: 'Configura tu alerta de TradingView con este formato JSON',
    copyFormat: 'Copiar Formato',
    testConnection: 'Probar Conexión',
    sendTestSignal: 'Enviar Señal de Prueba',
    sending: 'Enviando...',
    
    // Analytics Tab
    totalSignals: 'Total de Señales',
    todaySignals: 'Hoy',
    weekSignals: 'Semana',
    monthSignals: 'Mes',

    // Toast messages
    urlCopied: 'URL del webhook copiada al portapapeles',
    formatCopied: 'Formato de alerta copiado al portapapeles',
    testSent: 'Señal de prueba enviada exitosamente',
    testFailed: 'Error al enviar señal de prueba',
  },

  // Alert Logs Page
  alertLogs: {
    title: 'Registro de Alertas',
    subtitle: 'Ver y depurar intentos de entrega de alertas a tus integraciones',
    
    // Stats
    totalAlerts: 'Total de Alertas',
    successfulAlerts: 'Exitosas',
    failedAlerts: 'Fallidas',
    todayAlerts: 'Hoy',

    // Table
    timestamp: 'Marca de Tiempo',
    time: 'Hora',
    integration: 'Integración',
    strategy: 'Estrategia',
    signal: 'Señal',
    status: 'Estado',
    message: 'Mensaje',
    payload: 'Carga',
    response: 'Respuesta',
    success: 'Éxito',
    error: 'Error',
    pending: 'Pendiente',
    totalLogsFound: '{count} registros encontrados',
    refresh: 'Actualizar',

    // Filters
    searchLogs: 'Buscar registros...',
    filterByStatus: 'Filtrar por estado',
    filterByType: 'Filtrar por tipo',
    allStatuses: 'Todos los Estados',
    allTypes: 'Todos los Tipos',
    successOnly: 'Solo Exitosas',
    errorsOnly: 'Solo Errores',
    discord: 'Discord',
    slack: 'Slack',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    
    // Empty state
    noLogsFound: 'No se encontraron registros.',
    noLogsReason1: 'Aún no se han enviado señales',
    noLogsReason2: 'La función de envío de alertas no se ha activado',
    noLogsReason3: 'No hay integraciones configuradas o habilitadas',
    checkSupabaseLogs: 'Revisa los registros de la función Edge de Supabase para ver si la función está siendo llamada.',
    
    // Pagination
    page: 'Página {current} de {total}',
    previous: 'Anterior',
    next: 'Siguiente',
  },

  // API Keys Page
  apiKeys: {
    title: 'Claves API',
    subtitle: 'Crea claves API para que aplicaciones de terceros envíen señales',
    createApiKey: 'Crear Clave API',
    
    // Stats
    totalKeys: 'Total de Claves',
    activeKeys: 'Claves Activas',
    totalUsage: 'Uso Total',
    requestsThisMonth: 'solicitudes este mes',

    // Table
    name: 'Nombre',
    key: 'Clave',
    strategy: 'Estrategia',
    usage: 'Uso',
    status: 'Estado',
    lastUsed: 'Último Uso',
    actions: 'Acciones',
    active: 'Activa',
    disabled: 'Deshabilitada',
    revoked: 'Revocada',
    never: 'Nunca',
    neverUsed: 'Nunca usada',
    revokeKey: 'Revocar Clave',
    deleteKey: 'Eliminar Clave',
    configure: 'Configurar',
    requests: '{count} solicitudes',
    lastUsedDate: 'Último uso {date}',
    rateLimit: 'límite de {limit}/min',

    // Create Dialog
    createNewApiKey: 'Crear Clave API',
    editApiKey: 'Editar Clave API',
    createApiKeyDescription: 'Configura cómo tu aplicación de terceros envía señales',
    keyName: 'Nombre *',
    keyNamePlaceholder: 'ej., Mi Bot de Trading',
    description: 'Descripción',
    descriptionPlaceholder: '¿Para qué se usa esta clave API?',
    linkToStrategy: 'Vincular a Estrategia (Opcional)',
    autoStrategy: 'Auto (primera estrategia activa)',
    autoStrategyPlaceholder: 'Auto (usa la primera estrategia activa)',
    autoStrategyDescription: 'Deja vacío para enrutar automáticamente las señales a tu primera estrategia activa',
    payloadMapping: 'Mapeo de Carga',
    loadTemplate: 'Cargar plantilla...',
    mappingDescription: 'Mapea los campos de tu carga útil a nuestro formato de señal. Usa notación de punto para campos anidados (ej., data.ticker)',
    signalField: 'Campo de Señal',
    symbolField: 'Campo de Símbolo',
    priceField: 'Campo de Precio',
    timeField: 'Campo de Tiempo (Opcional)',
    timeFieldDescription: 'Deja vacío para usar la hora actual',
    rateLimitLabel: 'Límite de Velocidad (solicitudes por minuto)',
    rateLimitDescription: 'Tu plan {plan} permite hasta {limit} solicitudes por minuto',
    activeToggle: 'Activa',
    activeToggleDescription: 'Habilitar o deshabilitar esta clave API',
    selectStrategy: 'Seleccionar Estrategia',
    allStrategies: 'Todas las Estrategias',
    creating: 'Creando...',
    update: 'Actualizar',
    cancel: 'Cancelar',

    // API Endpoint
    apiEndpoint: 'Endpoint de API',
    recommended: 'Recomendado',
    alternativeEndpoint: 'Alternativa (Supabase directo):',
    sendPostRequest: 'Envía una solicitud POST con tu clave API en el encabezado {header}',
    xApiKeyHeader: 'x-api-key',

    // Empty State
    noApiKeys: 'Sin Claves API',
    noApiKeysDescription: 'Crea una clave API para permitir que aplicaciones de terceros envíen señales',

    // Quick Start Guide
    quickStartGuide: 'Guía de Inicio Rápido',
    exampleRequest: 'Ejemplo de Solicitud',
    expectedResponse: 'Respuesta Esperada',
    importantNotes: 'Notas Importantes',
    note1: 'Reemplaza {code} con tu clave API real',
    note2: 'Configura {strong} si tu formato de datos difiere',
    note3: 'Usa notación de punto para campos anidados (ej., {code2})',
    note4: 'El campo {code3} es opcional (por defecto usa la hora actual)',
    copied: '¡Copiado!',
    copy: 'Copiar',
    yourApiKey: 'TU_CLAVE_API',
    payloadMappingLabel: 'mapeo de carga útil',
    dataTicker: 'data.ticker',
    timeField: 'tiempo',

    // New Key Dialog
    apiKeyCreated: 'Clave API Creada',
    copyKeyWarning: '¡Copia tu clave API ahora. No podrás verla de nuevo!',
    yourApiKeyLabel: 'Tu Clave API',

    // Toast messages
    keyCreated: 'Clave API creada exitosamente',
    keyUpdated: 'Clave API actualizada exitosamente',
    keyCopied: 'Clave API copiada al portapapeles',
    codeCopied: 'Código copiado al portapapeles',
    keyRevoked: 'Clave API revocada',
    keyDeleted: 'Clave API eliminada',
    nameRequired: 'El nombre es requerido',
    failedToLoad: 'Error al cargar claves API',
    failedToCreate: 'Error al crear clave API',
    failedToUpdate: 'Error al actualizar clave API',
    failedToRevoke: 'Error al revocar clave API',
    failedToDelete: 'Error al eliminar clave API',
    upgradeRequired: 'Mejora Requerida',
    apiKeysNotAvailable: 'Las claves API están disponibles en los planes Pro y Elite. Mejora para crear integraciones API personalizadas.',
    planLimitReached: 'Tu plan {plan} permite {count} claves API. Mejora a Elite para claves API ilimitadas.',
    confirmDelete: '¿Estás seguro de que quieres eliminar esta clave API? Esta acción no se puede deshacer.',
  },

  // Integrations Page
  integrations: {
    title: 'Integraciones',
    subtitle: 'Conecta tus señales de trading a Discord, Slack, Telegram, WhatsApp y más',
    
    tradingView: 'TradingView',
    tradingViewDescription: 'Recibe alertas de estrategias de TradingView',
    trendSpider: 'TrendSpider',
    trendSpiderDescription: 'Conecta TrendSpider para alertas automatizadas',
    api: 'API Personalizada',
    apiDescription: 'Envía señales a través de nuestra API REST',
    
    connected: 'Conectado',
    notConnected: 'No Conectado',
    configure: 'Configurar',
    disconnect: 'Desconectar',
    learnMore: 'Más Información',
    
    // Sections
    availableIntegrations: 'Integraciones Disponibles',
    yourIntegrations: 'Tus Integraciones',
    configured: 'Configurada',
    allStrategies: 'Todas las Estrategias',
    
    // Dialog
    editIntegration: 'Editar Integración',
    configureIntegration: 'Configurar {name}',
    integrationDescription: 'Configura los ajustes de tu integración',
    name: 'Nombre',
    namePlaceholder: 'Mi Integración',
    strategyOptional: 'Estrategia (Opcional - deja vacío para todas las estrategias)',
    selectStrategy: 'Selecciona una estrategia',
    webhookUrl: 'URL del Webhook',
    webhookUrlPlaceholder: 'https://...',
    howToGetWebhook: 'Cómo obtener la URL del webhook',
    howToGetBotToken: 'Cómo obtener el token del bot y el ID del chat',
    howToSetupWhatsApp: 'Cómo configurar la integración de WhatsApp',
    enabled: 'Habilitado',
    cancel: 'Cancelar',
    update: 'Actualizar',
    create: 'Crear',
    updateIntegration: 'Actualizar Integración',
    createIntegration: 'Crear Integración',
    
    // Status
    active: 'Activa',
    inactive: 'Inactiva',
    lastUsed: 'Último uso: {date}',
    error: 'Error: {message}',
    
    // Toast messages
    integrationCreated: 'Integración Creada',
    integrationCreatedDescription: 'Tu integración ha sido creada exitosamente.',
    integrationUpdated: 'Integración Actualizada',
    integrationUpdatedDescription: 'Tu integración ha sido actualizada exitosamente.',
    integrationDeleted: 'Integración Eliminada',
    integrationDeletedDescription: 'Tu integración ha sido eliminada exitosamente.',
    failedToLoad: 'Error al cargar integraciones',
    failedToSave: 'Error al guardar integración',
    failedToDelete: 'Error al eliminar integración',
    upgradeRequired: 'Mejora Requerida',
    integrationsNotAvailable: 'Las integraciones están disponibles en los planes Pro y Elite. Mejora para conectar Discord, Slack y más.',
    planLimitReached: 'Tu plan {plan} permite {count} integraciones. Mejora a Elite para integraciones ilimitadas.',
    confirmDelete: '¿Estás seguro de que quieres eliminar esta integración?',
  },

  // Plan Features
  planFeatures: {
    unlimitedStrategies: 'Estrategias ilimitadas',
    unlimitedHistory: 'Historial ilimitado',
    apiAccess: 'Acceso API',
    dedicatedSupport: 'Soporte dedicado',
    oneStrategy: '1 Estrategia',
    sevenDayHistory: 'Historial de señales de 7 días',
    emailSupport: 'Soporte por correo',
    tenStrategies: '10 Estrategias',
    ninetyDayHistory: 'Historial de señales de 90 días',
    csvExport: 'Exportar CSV',
    publicPages: 'Páginas públicas',
  },

  // Billing Page
  billing: {
    title: 'Facturación',
    subtitle: 'Gestiona tu suscripción y métodos de pago',
    refreshStatus: 'Actualizar Estado',
    pleaseSignIn: 'Por favor inicia sesión para ver la facturación.',
    
    // Plan Status
    currentPlan: 'Plan Actual',
    yourActiveSubscription: 'Tu suscripción activa',
    freePlan: 'Plan Gratuito',
    proPlan: 'Plan Pro',
    elitePlan: 'Plan Elite',
    perMonth: '/mes',
    perForever: '/siempre',
    
    // Features
    features: 'Características',
    strategies: '{count} estrategias',
    signals: '{count} señales/mes',
    unlimited: 'Ilimitado',
    historyDays: '{days} días de historial',
    prioritySupport: 'Soporte prioritario',
    viewAllPlans: 'Ver Todos los Planes',
    comparePlans: 'Comparar Planes',
    
    // Subscription Management
    subscriptionManagement: 'Gestión de Suscripción',
    manageSubscriptionDescription: 'Gestiona tu suscripción, actualiza el método de pago o cancela',
    upgradeDescription: 'Mejora a un plan de pago para desbloquear más funciones',
    activeSubscription: 'Suscripción Activa',
    activeSubscriptionDescription: 'Plan {plan} vía Stripe',
    noActiveSubscription: 'Sin suscripción activa',
    noActiveSubscriptionDescription: 'Estás en el plan gratuito',
    manageSubscription: 'Gestionar Suscripción',
    updatePaymentMethod: 'Actualizar método de pago, cambiar plan o cancelar suscripción',
    upgradeToPro: 'Mejorar a Pro - $19/mes',
    upgradeToElite: 'Mejorar a Elite - $49/mes',
    
    // Change Plan
    changeYourPlan: 'Cambiar Tu Plan',
    bestPlanDescription: '¡Estás en nuestro mejor plan! Las opciones de reducción están disponibles a continuación.',
    upgradeDowngradeDescription: 'Mejora a Elite o reduce a Gratuito',
    choosePlanDescription: 'Elige el plan que se ajuste a tus necesidades',
    current: 'Actual',
    upgrade: 'Mejorar',
    downgrade: 'Reducir',
    currentPlanButton: 'Plan Actual',
    upgradeTo: 'Mejorar a {plan}',
    cancelSubscription: 'Cancelar Suscripción',
    downgradeTo: 'Reducir a {plan}',
    downgradeNotice: 'Las reducciones y cancelaciones se manejan a través de Stripe. Tu acceso continúa hasta el final de tu período de facturación.',
    
    // Billing History
    billingHistory: 'Historial de Facturación',
    viewInvoicesDescription: 'Ver tus facturas y pagos anteriores',
    viewInvoicesDescription2: 'Ver y descargar tus facturas desde el Portal de Clientes de Stripe',
    viewInvoices: 'Ver Facturas',
    noBillingHistory: 'Sin historial de facturación aún',
    noBillingHistoryDescription: 'Tus facturas aparecerán aquí una vez que mejores',
    
    // Status
    active: 'Activo',
    cancelled: 'Cancelado',
    expiresOn: 'Expira el {date}',
    renewsOn: 'Se renueva el {date}',
    
    // Processing
    processingPayment: 'Procesando tu pago...',
    processingSubscription: 'Procesando tu suscripción...',
    subscriptionActivating: 'Por favor espera mientras activamos tu suscripción. Esto puede tomar unos momentos.',
    
    // Error
    error: 'Error',
    tryAgain: 'Intentar de nuevo',
    
    // Toast messages
    paymentSuccessful: '¡Pago exitoso! Activando tu suscripción...',
    subscriptionActivated: '¡Suscripción activada! Disfruta de tu nuevo plan.',
    checkoutCanceled: 'El checkout fue cancelado. No se realizaron cargos.',
    subscriptionUpdated: 'Suscripción actualizada exitosamente',
    failedToUpdate: 'Error al actualizar suscripción',
    redirectingToCheckout: 'Redirigiendo al checkout...',
    redirectingToPortal: 'Redirigiendo al portal de facturación...',
  },

  // Preferences Page
  preferences: {
    title: 'Preferencias',
    subtitle: 'Personaliza tu experiencia en la aplicación',
    
    // Appearance
    appearance: 'Apariencia',
    appearanceDescription: 'Personaliza el aspecto de la aplicación',
    theme: 'Tema',
    themeDescription: 'Elige entre modo claro y oscuro',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    colorScheme: 'Esquema de Color',
    colorSchemeDescription: 'Elige tu color de acento preferido',
    
    // Language
    language: 'Idioma',
    languageDescription: 'Elige tu idioma preferido',
    english: 'English',
    spanish: 'Español',
    
    // Display
    display: 'Visualización',
    displayDescription: 'Personaliza cómo se muestra la información',
    currency: 'Moneda',
    currencyDescription: 'Elige tu moneda preferida para mostrar valores',
    dateFormat: 'Formato de Fecha',
    dateFormatDescription: 'Elige tu formato de fecha preferido',
    
    // Notifications
    notifications: 'Notificaciones',
    notificationsDescription: 'Gestiona tus preferencias de notificación',
    emailNotifications: 'Notificaciones por Email',
    emailNotificationsDescription: 'Recibe notificaciones por email para eventos importantes',
    pushNotifications: 'Notificaciones Push',
    pushNotificationsDescription: 'Recibe notificaciones push en tu navegador',
    
    // Toast messages
    preferencesSaved: 'Preferencias guardadas',
    failedToSave: 'Error al guardar preferencias',
  },

  // Date Filter
  dateFilter: {
    allTime: 'Todo el Tiempo',
    today: 'Hoy',
    thisWeek: 'Esta Semana',
    thisMonth: 'Este Mes',
    thisYear: 'Este Año',
    customRange: 'Rango Personalizado',
    pickDateRange: 'Selecciona un rango de fechas',
  },

  // Empty States
  empty: {
    noSignals: 'Sin señales aún',
    noSignalsDescription: 'Las señales aparecerán aquí una vez que tus estrategias reciban alertas de TradingView',
    noStrategies: 'Sin estrategias aún',
    noStrategiesDescription: 'Crea tu primera estrategia para comenzar a recibir señales de TradingView y automatizar tus alertas de trading.',
    noTrades: 'Sin operaciones aún',
    noTradesDescription: 'Las operaciones aparecerán aquí una vez que se procesen las señales',
    noResults: 'Sin resultados',
    noResultsDescription: 'No pudimos encontrar nada que coincida con "{query}". Intenta ajustar tu búsqueda o filtros.',
    noOpenTrades: 'Sin operaciones abiertas',
    noOpenTradesDescription: 'Las posiciones abiertas de tus señales aparecerán aquí cuando recibas señales de COMPRA.',
    noClosedTrades: 'Sin operaciones cerradas',
    noClosedTradesDescription: 'Las operaciones completadas aparecerán aquí una vez que se cierren las posiciones.',
  },

  // Feedback
  feedback: {
    title: 'Enviar Comentarios',
    submitFeedback: 'Enviar Comentarios',
    description: '¡Nos encantaría saber de ti! Comparte tus pensamientos, reporta errores o sugiere nuevas funciones.',
    category: 'Categoría',
    selectCategory: 'Selecciona una categoría',
    subject: 'Asunto',
    subjectPlaceholder: 'Breve descripción de tus comentarios',
    message: 'Mensaje',
    messagePlaceholder: 'Por favor proporciona tantos detalles como sea posible...',
    name: 'Nombre',
    nameOptional: 'Nombre (Opcional)',
    namePlaceholder: 'Tu nombre',
    cancel: 'Cancelar',
    submitting: 'Enviando...',
    typePlaceholder: 'Selecciona tipo de comentario',
    bug: 'Reporte de Error',
    feature: 'Solicitud de Función',
    improvement: 'Mejora de UI/UX',
    performance: 'Problema de Rendimiento',
    documentation: 'Documentación',
    other: 'Otro',
    thankYou: '¡Gracias!',
    feedbackReceived: 'Gracias por tus comentarios. Apreciamos tu aporte.',
    feedbackSubmitted: '¡Comentarios enviados!',
    missingFields: 'Campos requeridos faltantes',
    missingFieldsDescription: 'Por favor completa todos los campos requeridos.',
    error: 'Error',
    failedToSubmit: 'Error al enviar comentarios. Por favor intenta de nuevo.',
    systemNotAvailable: 'Sistema de comentarios no disponible',
    systemNotAvailableDescription: 'El sistema de comentarios se está configurando. Por favor intenta más tarde.',
  },
};

