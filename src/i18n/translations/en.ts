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
    subtitle: 'View and debug alert delivery attempts to your integrations',
    
    // Stats
    totalAlerts: 'Total Alerts',
    successfulAlerts: 'Successful',
    failedAlerts: 'Failed',
    todayAlerts: 'Today',

    // Table
    timestamp: 'Timestamp',
    time: 'Time',
    integration: 'Integration',
    strategy: 'Strategy',
    signal: 'Signal',
    status: 'Status',
    message: 'Message',
    payload: 'Payload',
    response: 'Response',
    success: 'Success',
    error: 'Error',
    pending: 'Pending',
    totalLogsFound: '{count} total logs found',
    refresh: 'Refresh',

    // Filters
    searchLogs: 'Search logs...',
    filterByStatus: 'Filter by status',
    filterByType: 'Filter by type',
    allStatuses: 'All Statuses',
    allTypes: 'All Types',
    successOnly: 'Success Only',
    errorsOnly: 'Errors Only',
    discord: 'Discord',
    slack: 'Slack',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    
    // Empty state
    noLogsFound: 'No logs found.',
    noLogsReason1: 'No signals have been sent yet',
    noLogsReason2: 'The send-alerts function hasn\'t been triggered',
    noLogsReason3: 'No integrations are configured or enabled',
    checkSupabaseLogs: 'Check Supabase Edge Function logs to see if the function is being called.',
    
    // Pagination
    page: 'Page {current} of {total}',
    previous: 'Previous',
    next: 'Next',
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
    disabled: 'Disabled',
    revoked: 'Revoked',
    never: 'Never',
    neverUsed: 'Never used',
    revokeKey: 'Revoke Key',
    deleteKey: 'Delete Key',
    configure: 'Configure',
    requests: '{count} requests',
    lastUsedDate: 'Last used {date}',
    rateLimit: '{limit}/min limit',

    // Create Dialog
    createNewApiKey: 'Create API Key',
    editApiKey: 'Edit API Key',
    createApiKeyDescription: 'Configure how your third-party application sends signals',
    keyName: 'Name *',
    keyNamePlaceholder: 'e.g., My Trading Bot',
    description: 'Description',
    descriptionPlaceholder: 'What is this API key used for?',
    linkToStrategy: 'Link to Strategy (Optional)',
    autoStrategy: 'Auto (first active strategy)',
    autoStrategyPlaceholder: 'Auto (uses first active strategy)',
    autoStrategyDescription: 'Leave empty to automatically route signals to your first active strategy',
    payloadMapping: 'Payload Mapping',
    loadTemplate: 'Load template...',
    mappingDescription: 'Map your payload fields to our signal format. Use dot notation for nested fields (e.g., data.ticker)',
    signalField: 'Signal Field',
    symbolField: 'Symbol Field',
    priceField: 'Price Field',
    timeField: 'Time Field (Optional)',
    timeFieldDescription: 'Leave empty to use current time',
    rateLimitLabel: 'Rate Limit (requests per minute)',
    rateLimitDescription: 'Your {plan} plan allows up to {limit} requests per minute',
    activeToggle: 'Active',
    activeToggleDescription: 'Enable or disable this API key',
    selectStrategy: 'Select Strategy',
    allStrategies: 'All Strategies',
    creating: 'Creating...',
    update: 'Update',
    cancel: 'Cancel',

    // API Endpoint
    apiEndpoint: 'API Endpoint',
    recommended: 'Recommended',
    alternativeEndpoint: 'Alternative (direct Supabase):',
    sendPostRequest: 'Send a POST request with your API key in the {header} header',
    xApiKeyHeader: 'x-api-key',

    // Empty State
    noApiKeys: 'No API Keys',
    noApiKeysDescription: 'Create an API key to allow third-party applications to send signals',

    // Quick Start Guide
    quickStartGuide: 'Quick Start Guide',
    exampleRequest: 'Example Request',
    expectedResponse: 'Expected Response',
    importantNotes: 'Important Notes',
    note1: 'Replace {code} with your actual API key',
    note2: 'Configure {strong} if your data format differs',
    note3: 'Use dot notation for nested fields (e.g., {code2})',
    note4: 'The {code3} field is optional (defaults to current time)',
    copied: 'Copied!',
    copy: 'Copy',
    yourApiKey: 'YOUR_API_KEY',
    payloadMappingLabel: 'payload mapping',
    dataTicker: 'data.ticker',
    timeField: 'time',

    // New Key Dialog
    apiKeyCreated: 'API Key Created',
    copyKeyWarning: 'Copy your API key now. You won\'t be able to see it again!',
    yourApiKeyLabel: 'Your API Key',

    // Toast messages
    keyCreated: 'API key created successfully',
    keyUpdated: 'API key updated successfully',
    keyCopied: 'API key copied to clipboard',
    codeCopied: 'Code copied to clipboard',
    keyRevoked: 'API key revoked',
    keyDeleted: 'API key deleted',
    nameRequired: 'Name is required',
    failedToLoad: 'Failed to load API keys',
    failedToCreate: 'Failed to create API key',
    failedToUpdate: 'Failed to update API key',
    failedToRevoke: 'Failed to revoke API key',
    failedToDelete: 'Failed to delete API key',
    upgradeRequired: 'Upgrade Required',
    apiKeysNotAvailable: 'API Keys are available on Pro and Elite plans. Upgrade to create custom API integrations.',
    planLimitReached: 'Your {plan} plan allows {count} API keys. Upgrade to Elite for unlimited API keys.',
    confirmDelete: 'Are you sure you want to delete this API key? This action cannot be undone.',
  },

  // Integrations Page
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect your trading signals to Discord, Slack, Telegram, WhatsApp, and more',
    
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
    
    // Sections
    availableIntegrations: 'Available Integrations',
    yourIntegrations: 'Your Integrations',
    configured: 'Configured',
    allStrategies: 'All Strategies',
    
    // Dialog
    editIntegration: 'Edit Integration',
    configureIntegration: 'Configure {name}',
    integrationDescription: 'Configure your integration settings',
    name: 'Name',
    namePlaceholder: 'My Integration',
    strategyOptional: 'Strategy (Optional - leave empty for all strategies)',
    selectStrategy: 'Select a strategy',
    webhookUrl: 'Webhook URL',
    webhookUrlPlaceholder: 'https://...',
    howToGetWebhook: 'How to get webhook URL',
    howToGetBotToken: 'How to get bot token and chat ID',
    howToSetupWhatsApp: 'How to set up WhatsApp integration',
    enabled: 'Enabled',
    cancel: 'Cancel',
    update: 'Update',
    create: 'Create',
    updateIntegration: 'Update Integration',
    createIntegration: 'Create Integration',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    lastUsed: 'Last used: {date}',
    error: 'Error: {message}',
    
    // Toast messages
    integrationCreated: 'Integration Created',
    integrationCreatedDescription: 'Your integration has been created successfully.',
    integrationUpdated: 'Integration Updated',
    integrationUpdatedDescription: 'Your integration has been updated successfully.',
    integrationDeleted: 'Integration Deleted',
    integrationDeletedDescription: 'Your integration has been deleted successfully.',
    failedToLoad: 'Failed to load integrations',
    failedToSave: 'Failed to save integration',
    failedToDelete: 'Failed to delete integration',
    upgradeRequired: 'Upgrade Required',
    integrationsNotAvailable: 'Integrations are available on Pro and Elite plans. Upgrade to connect Discord, Slack, and more.',
    planLimitReached: 'Your {plan} plan allows {count} integrations. Upgrade to Elite for unlimited integrations.',
    confirmDelete: 'Are you sure you want to delete this integration?',
  },

  // Billing Page
  billing: {
    title: 'Billing',
    subtitle: 'Manage your subscription and payment methods',
    refreshStatus: 'Refresh Status',
    pleaseSignIn: 'Please sign in to view billing.',
    
    // Plan Status
    currentPlan: 'Current Plan',
    yourActiveSubscription: 'Your active subscription',
    freePlan: 'Free Plan',
    proPlan: 'Pro Plan',
    elitePlan: 'Elite Plan',
    perMonth: '/month',
    perForever: '/forever',
    
    // Features
    features: 'Features',
    strategies: '{count} strategies',
    signals: '{count} signals/month',
    unlimited: 'Unlimited',
    historyDays: '{days} days history',
    prioritySupport: 'Priority support',
    viewAllPlans: 'View All Plans',
    comparePlans: 'Compare Plans',
    
    // Subscription Management
    subscriptionManagement: 'Subscription Management',
    manageSubscriptionDescription: 'Manage your subscription, update payment method, or cancel',
    upgradeDescription: 'Upgrade to a paid plan to unlock more features',
    activeSubscription: 'Active Subscription',
    activeSubscriptionDescription: '{plan} plan via Stripe',
    noActiveSubscription: 'No active subscription',
    noActiveSubscriptionDescription: 'You\'re on the free plan',
    manageSubscription: 'Manage Subscription',
    updatePaymentMethod: 'Update payment method, change plan, or cancel subscription',
    upgradeToPro: 'Upgrade to Pro - $19/mo',
    upgradeToElite: 'Upgrade to Elite - $49/mo',
    
    // Change Plan
    changeYourPlan: 'Change Your Plan',
    bestPlanDescription: 'You\'re on our best plan! Downgrade options are available below.',
    upgradeDowngradeDescription: 'Upgrade to Elite or downgrade to Free',
    choosePlanDescription: 'Choose the plan that fits your needs',
    current: 'Current',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    currentPlanButton: 'Current Plan',
    upgradeTo: 'Upgrade to {plan}',
    cancelSubscription: 'Cancel Subscription',
    downgradeTo: 'Downgrade to {plan}',
    downgradeNotice: 'Downgrades and cancellations are handled through Stripe. Your access continues until the end of your billing period.',
    
    // Billing History
    billingHistory: 'Billing History',
    viewInvoicesDescription: 'View your past invoices and payments',
    viewInvoicesDescription2: 'View and download your invoices from the Stripe Customer Portal',
    viewInvoices: 'View Invoices',
    noBillingHistory: 'No billing history yet',
    noBillingHistoryDescription: 'Your invoices will appear here once you upgrade',
    
    // Status
    active: 'Active',
    cancelled: 'Cancelled',
    expiresOn: 'Expires on {date}',
    renewsOn: 'Renews on {date}',
    
    // Processing
    processingPayment: 'Processing your payment...',
    processingSubscription: 'Processing your subscription...',
    subscriptionActivating: 'Please wait while we activate your subscription. This may take a few moments.',
    
    // Error
    error: 'Error',
    tryAgain: 'Try again',
    
    // Toast messages
    paymentSuccessful: 'Payment successful! Activating your subscription...',
    subscriptionActivated: 'Subscription activated! Enjoy your new plan.',
    checkoutCanceled: 'Checkout was canceled. No charges were made.',
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

