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
    subtitle: 'Ver solicitudes de webhook entrantes y su estado de procesamiento',
    
    // Stats
    totalAlerts: 'Total de Alertas',
    successfulAlerts: 'Exitosas',
    failedAlerts: 'Fallidas',
    todayAlerts: 'Hoy',

    // Table
    timestamp: 'Marca de Tiempo',
    strategy: 'Estrategia',
    status: 'Estado',
    payload: 'Carga',
    response: 'Respuesta',
    success: 'Éxito',
    error: 'Error',

    // Filters
    allStatuses: 'Todos los Estados',
    successOnly: 'Solo Exitosas',
    errorsOnly: 'Solo Errores',
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
    revoked: 'Revocada',
    never: 'Nunca',
    revokeKey: 'Revocar Clave',
    deleteKey: 'Eliminar Clave',

    // Create Dialog
    createNewApiKey: 'Crear Clave API',
    createApiKeyDescription: 'Genera una nueva clave API para enviar señales',
    keyName: 'Nombre de la Clave',
    keyNamePlaceholder: 'ej., Bot de Trading',
    selectStrategy: 'Seleccionar Estrategia',
    allStrategies: 'Todas las Estrategias',
    creating: 'Creando...',

    // New Key Dialog
    apiKeyCreated: 'Clave API Creada',
    copyKeyWarning: '¡Copia tu clave API ahora. No podrás verla de nuevo!',
    yourApiKey: 'Tu Clave API',

    // Toast messages
    keyCreated: 'Clave API creada exitosamente',
    keyCopied: 'Clave API copiada al portapapeles',
    keyRevoked: 'Clave API revocada',
    keyDeleted: 'Clave API eliminada',
    failedToCreate: 'Error al crear clave API',
    failedToRevoke: 'Error al revocar clave API',
    failedToDelete: 'Error al eliminar clave API',
  },

  // Integrations Page
  integrations: {
    title: 'Integraciones',
    subtitle: 'Conecta tus plataformas de trading favoritas',
    
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
  },

  // Billing Page
  billing: {
    title: 'Facturación',
    subtitle: 'Gestiona tu suscripción y métodos de pago',
    refreshStatus: 'Actualizar Estado',
    
    // Plan Status
    currentPlan: 'Plan Actual',
    freePlan: 'Plan Gratuito',
    proPlan: 'Plan Pro',
    elitePlan: 'Plan Elite',
    perMonth: '/mes',
    
    // Features
    features: 'Características',
    strategies: '{count} estrategias',
    signals: '{count} señales/mes',
    unlimited: 'Ilimitado',
    historyDays: '{days} días de historial',
    prioritySupport: 'Soporte prioritario',
    
    // Actions
    upgrade: 'Mejorar',
    downgrade: 'Reducir',
    manageBilling: 'Gestionar Facturación',
    manageSubscription: 'Gestionar Suscripción',
    
    // Status
    active: 'Activo',
    cancelled: 'Cancelado',
    expiresOn: 'Expira el {date}',
    renewsOn: 'Se renueva el {date}',
    
    // Processing
    processingPayment: 'Procesando tu pago...',
    subscriptionActivating: 'Tu suscripción se está activando. Esto puede tomar unos momentos.',
    
    // Toast messages
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
    description: 'Ayúdanos a mejorar SignalPulse',
    typePlaceholder: 'Selecciona tipo de comentario',
    bug: 'Reporte de Error',
    feature: 'Solicitud de Función',
    improvement: 'Mejora',
    other: 'Otro',
    messagePlaceholder: 'Describe tu comentario...',
    submit: 'Enviar Comentarios',
    submitting: 'Enviando...',
    thankYou: '¡Gracias!',
    feedbackReceived: 'Tu comentario ha sido recibido',
  },
};

