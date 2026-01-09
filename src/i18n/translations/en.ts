// English translations
export const en = {
  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    add: 'Add',
    remove: 'Remove',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    copy: 'Copy',
    copied: 'Copied!',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    viewAll: 'View All',
    noData: 'No data available',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    enabled: 'Enabled',
    disabled: 'Disabled',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    none: 'None',
    unknown: 'Unknown',
    optional: 'Optional',
    required: 'Required',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    signals: 'Signals',
    strategies: 'Strategies',
    alertLogs: 'Alert Logs',
    apiKeys: 'API Keys',
    integrations: 'Integrations',
    billing: 'Billing',
    preferences: 'Preferences',
    signOut: 'Sign Out',
    adminPanel: 'Admin Panel',
  },

  // Dashboard Page
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Track and manage your trading signals',
    newStrategy: 'New Strategy',
    
    // Stats
    totalPnL: 'Total P&L',
    closedTrades: 'closed trades',
    winRate: 'Win Rate',
    wins: 'wins',
    noTrades: 'No trades',
    signalsToday: 'Signals Today',
    last24Hours: 'Last 24 hours',
    thisWeek: 'This Week',
    last7Days: 'Last 7 days',
    strategies: 'Strategies',
    activeStrategies: 'Active strategies',
    topSymbol: 'Top Symbol',
    mostSignals: 'Most signals',
    openPositions: 'Open Positions',
    activeTrades: 'Active trades',
    bestTrade: 'Best Trade',
    topPerformer: 'Top performer',

    // Tables
    openTrades: 'Open Trades',
    closedTrades: 'Closed Trades',
    direction: 'Direction',
    symbol: 'Symbol',
    entryPrice: 'Entry Price',
    exitPrice: 'Exit Price',
    current: 'Current',
    pnl: 'P&L',
    strategy: 'Strategy',
    entryTime: 'Entry Time',
    time: 'Time',
    long: 'LONG',
    short: 'SHORT',
  },

  // Signals Page
  signals: {
    title: 'All Signals',
    subtitle: 'View and filter all your trading signals',
    addSignal: 'Add Signal',
    exportCSV: 'Export CSV',
    
    // Stats
    totalSignals: 'Total Signals',
    buySignals: 'BUY Signals',
    sellSignals: 'SELL Signals',
    potentialDuplicates: 'Potential Duplicates',

    // Filters
    filters: 'Filters',
    filterDescription: 'Filter signals by strategy, symbol, or type',
    searchSignals: 'Search signals...',
    allStrategies: 'All Strategies',
    filterBySymbol: 'Filter by symbol...',
    allTypes: 'All Types',
    buyLong: 'BUY/LONG',
    sellShort: 'SELL/SHORT',

    // Table
    dateTime: 'Date & Time',
    signal: 'Signal',
    price: 'Price',
    source: 'Source',

    // Manual Signal Dialog
    addManualSignal: 'Add Manual Signal',
    manualSignalDescription: 'Enter a signal manually to track your trades. This works the same as signals from TradingView.',
    selectStrategy: 'Select a strategy',
    noStrategiesFound: 'No strategies found. Create a strategy first.',
    signalType: 'Signal Type',
    selectSignalType: 'Select signal type',
    buyLongEntry: 'BUY (Long Entry)',
    sellShortEntry: 'SELL (Short Entry / Exit Long)',
    longOpenPosition: 'LONG (Open Long Position)',
    shortOpenPosition: 'SHORT (Open Short Position)',
    closePosition: 'CLOSE (Close Position)',
    symbolPlaceholder: 'e.g., AAPL, BTCUSD',
    pricePlaceholder: 'e.g., 150.25',
    signalTime: 'Signal Time',
    signalTimeDescription: 'When did this signal occur? Defaults to now.',
    notes: 'Notes',
    notesPlaceholder: 'e.g., RSI oversold, support level',
    adding: 'Adding...',

    // Toast messages
    signalAdded: 'Signal Added',
    signalAddedDescription: 'Manual {type} signal for {symbol} added successfully',
    exported: 'Exported',
    signalsExported: 'Signals exported to CSV',
    validationError: 'Validation Error',
    pleaseSelectStrategy: 'Please select a strategy',
    pleaseSelectSignalType: 'Please select a signal type',
    pleaseEnterSymbol: 'Please enter a symbol',
    pleaseEnterValidPrice: 'Please enter a valid price',
    failedToAddSignal: 'Failed to add signal',
    failedToLoadSignals: 'Failed to load signals',
  },

  // Strategies Page
  strategies: {
    title: 'Strategies',
    subtitle: 'Manage your trading strategies',
    newStrategy: 'New Strategy',
    
    // Stats
    totalStrategies: 'Total Strategies',
    publicStrategies: 'Public',
    totalSignals: 'Total Signals',
    last7Days: 'Last 7 days',
    lastSignal: 'Last Signal',
    neverReceived: 'Never received',
    receivedAgo: '{time} ago',

    // Table
    name: 'Name',
    visibility: 'Visibility',
    signals: 'Signals',
    status: 'Status',
    actions: 'Actions',
    public: 'Public',
    private: 'Private',
    configured: 'Configured',
    pendingSetup: 'Pending Setup',
    viewDetails: 'View Details',
    copyWebhook: 'Copy Webhook',
    deleteStrategy: 'Delete Strategy',
    
    // Create Dialog
    createStrategy: 'Create Strategy',
    createStrategyDescription: 'Set up a new strategy to receive TradingView signals',
    strategyName: 'Strategy Name',
    strategyNamePlaceholder: 'e.g., RSI Momentum',
    description: 'Description',
    descriptionPlaceholder: 'Brief description of your strategy',
    publicStrategy: 'Public Strategy',
    publicStrategyDescription: 'Allow others to view this strategy',
    creating: 'Creating...',

    // Toast messages
    strategyCreated: 'Strategy Created',
    strategyCreatedDescription: 'Your strategy has been created successfully',
    webhookCopied: 'Webhook URL copied to clipboard',
    strategyDeleted: 'Strategy Deleted',
    strategyDeletedDescription: 'Strategy has been deleted',
    failedToCreate: 'Failed to create strategy',
    failedToDelete: 'Failed to delete strategy',
  },

  // Strategy Detail Page
  strategyDetail: {
    back: 'Back',
    signals: 'Signals',
    setup: 'Setup',
    analytics: 'Analytics',
    
    // Setup Tab
    webhookUrl: 'Webhook URL',
    webhookDescription: 'Use this URL in TradingView alerts to send signals to this strategy',
    copyUrl: 'Copy URL',
    alertMessageFormat: 'Alert Message Format',
    alertFormatDescription: 'Configure your TradingView alert with this JSON format',
    copyFormat: 'Copy Format',
    testConnection: 'Test Connection',
    sendTestSignal: 'Send Test Signal',
    sending: 'Sending...',
    
    // Analytics Tab
    totalSignals: 'Total Signals',
    todaySignals: 'Today',
    weekSignals: 'Week',
    monthSignals: 'Month',

    // Toast messages
    urlCopied: 'Webhook URL copied to clipboard',
    formatCopied: 'Alert format copied to clipboard',
    testSent: 'Test signal sent successfully',
    testFailed: 'Failed to send test signal',
  },

  // Alert Logs Page
  alertLogs: {
    title: 'Alert Logs',
    subtitle: 'View incoming webhook requests and their processing status',
    
    // Stats
    totalAlerts: 'Total Alerts',
    successfulAlerts: 'Successful',
    failedAlerts: 'Failed',
    todayAlerts: 'Today',

    // Table
    timestamp: 'Timestamp',
    strategy: 'Strategy',
    status: 'Status',
    payload: 'Payload',
    response: 'Response',
    success: 'Success',
    error: 'Error',

    // Filters
    allStatuses: 'All Statuses',
    successOnly: 'Success Only',
    errorsOnly: 'Errors Only',
  },

  // API Keys Page
  apiKeys: {
    title: 'API Keys',
    subtitle: 'Create API keys for third-party applications to send signals',
    createApiKey: 'Create API Key',
    
    // Stats
    totalKeys: 'Total Keys',
    activeKeys: 'Active Keys',
    totalUsage: 'Total Usage',
    requestsThisMonth: 'requests this month',

    // Table
    name: 'Name',
    key: 'Key',
    strategy: 'Strategy',
    usage: 'Usage',
    status: 'Status',
    lastUsed: 'Last Used',
    actions: 'Actions',
    active: 'Active',
    revoked: 'Revoked',
    never: 'Never',
    revokeKey: 'Revoke Key',
    deleteKey: 'Delete Key',

    // Create Dialog
    createNewApiKey: 'Create API Key',
    createApiKeyDescription: 'Generate a new API key for sending signals',
    keyName: 'Key Name',
    keyNamePlaceholder: 'e.g., Trading Bot',
    selectStrategy: 'Select Strategy',
    allStrategies: 'All Strategies',
    creating: 'Creating...',

    // New Key Dialog
    apiKeyCreated: 'API Key Created',
    copyKeyWarning: 'Copy your API key now. You won\'t be able to see it again!',
    yourApiKey: 'Your API Key',

    // Toast messages
    keyCreated: 'API key created successfully',
    keyCopied: 'API key copied to clipboard',
    keyRevoked: 'API key revoked',
    keyDeleted: 'API key deleted',
    failedToCreate: 'Failed to create API key',
    failedToRevoke: 'Failed to revoke API key',
    failedToDelete: 'Failed to delete API key',
  },

  // Integrations Page
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect your favorite trading platforms',
    
    tradingView: 'TradingView',
    tradingViewDescription: 'Receive alerts from TradingView strategies',
    trendSpider: 'TrendSpider',
    trendSpiderDescription: 'Connect TrendSpider for automated alerts',
    api: 'Custom API',
    apiDescription: 'Send signals via our REST API',
    
    connected: 'Connected',
    notConnected: 'Not Connected',
    configure: 'Configure',
    disconnect: 'Disconnect',
    learnMore: 'Learn More',
  },

  // Billing Page
  billing: {
    title: 'Billing',
    subtitle: 'Manage your subscription and payment methods',
    refreshStatus: 'Refresh Status',
    
    // Plan Status
    currentPlan: 'Current Plan',
    freePlan: 'Free Plan',
    proPlan: 'Pro Plan',
    elitePlan: 'Elite Plan',
    perMonth: '/month',
    
    // Features
    features: 'Features',
    strategies: '{count} strategies',
    signals: '{count} signals/month',
    unlimited: 'Unlimited',
    historyDays: '{days} days history',
    prioritySupport: 'Priority support',
    
    // Actions
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    manageBilling: 'Manage Billing',
    manageSubscription: 'Manage Subscription',
    
    // Status
    active: 'Active',
    cancelled: 'Cancelled',
    expiresOn: 'Expires on {date}',
    renewsOn: 'Renews on {date}',
    
    // Processing
    processingPayment: 'Processing your payment...',
    subscriptionActivating: 'Your subscription is being activated. This may take a few moments.',
    
    // Toast messages
    subscriptionUpdated: 'Subscription updated successfully',
    failedToUpdate: 'Failed to update subscription',
    redirectingToCheckout: 'Redirecting to checkout...',
    redirectingToPortal: 'Redirecting to billing portal...',
  },

  // Preferences Page
  preferences: {
    title: 'Preferences',
    subtitle: 'Customize your app experience',
    
    // Appearance
    appearance: 'Appearance',
    appearanceDescription: 'Customize the look and feel of the application',
    theme: 'Theme',
    themeDescription: 'Choose between light and dark mode',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    colorScheme: 'Color Scheme',
    colorSchemeDescription: 'Choose your preferred accent color',
    
    // Language
    language: 'Language',
    languageDescription: 'Choose your preferred language',
    english: 'English',
    spanish: 'Español',
    
    // Display
    display: 'Display',
    displayDescription: 'Customize how information is displayed',
    currency: 'Currency',
    currencyDescription: 'Choose your preferred currency for displaying values',
    dateFormat: 'Date Format',
    dateFormatDescription: 'Choose your preferred date format',
    
    // Notifications
    notifications: 'Notifications',
    notificationsDescription: 'Manage your notification preferences',
    emailNotifications: 'Email Notifications',
    emailNotificationsDescription: 'Receive email notifications for important events',
    pushNotifications: 'Push Notifications',
    pushNotificationsDescription: 'Receive push notifications in your browser',
    
    // Toast messages
    preferencesSaved: 'Preferences saved',
    failedToSave: 'Failed to save preferences',
  },

  // Date Filter
  dateFilter: {
    allTime: 'All Time',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    customRange: 'Custom Range',
    pickDateRange: 'Pick a date range',
  },

  // Empty States
  empty: {
    noSignals: 'No signals yet',
    noSignalsDescription: 'Signals will appear here once your strategies receive alerts from TradingView',
    noStrategies: 'No strategies yet',
    noStrategiesDescription: 'Create your first strategy to start receiving TradingView signals and automate your trading alerts.',
    noTrades: 'No trades yet',
    noTradesDescription: 'Trades will appear here once signals are processed',
    noResults: 'No results found',
    noResultsDescription: 'We couldn\'t find anything matching "{query}". Try adjusting your search or filters.',
    noOpenTrades: 'No open trades',
    noOpenTradesDescription: 'Open positions from your signals will appear here when you receive BUY signals.',
    noClosedTrades: 'No closed trades',
    noClosedTradesDescription: 'Completed trades will appear here once positions are closed.',
  },

  // Feedback
  feedback: {
    title: 'Send Feedback',
    description: 'Help us improve SignalPulse',
    typePlaceholder: 'Select feedback type',
    bug: 'Bug Report',
    feature: 'Feature Request',
    improvement: 'Improvement',
    other: 'Other',
    messagePlaceholder: 'Describe your feedback...',
    submit: 'Submit Feedback',
    submitting: 'Submitting...',
    thankYou: 'Thank you!',
    feedbackReceived: 'Your feedback has been received',
  },
};

export type TranslationKeys = typeof en;

