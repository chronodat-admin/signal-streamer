import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Moon, Sun, Save, DollarSign, Calendar, Bell, Globe, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { usePreferences, type Currency, type DateFormat } from '@/hooks/usePreferences';
import { toast } from '@/hooks/use-toast';
import { useLanguage, type Language } from '@/i18n';

const Preferences = () => {
  const { theme, setTheme } = useTheme();
  const { preferences, setCurrency, setDateFormat, setSignalNotifications, setAiInsightsEnabled } = usePreferences();
  const { t, language, setLanguage } = useLanguage();

  const handleSave = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    toast({
      title: t.preferences.preferencesSaved,
      description: t.preferences.preferencesSaved,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">{t.preferences.title}</h1>
          <p className="text-muted-foreground text-lg">{t.preferences.subtitle}</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Language Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t.preferences.language}
              </CardTitle>
              <CardDescription>
                {t.preferences.languageDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="language">{t.preferences.language}</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as Language)}
                >
                  <SelectTrigger id="language" className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 {t.preferences.english}</SelectItem>
                    <SelectItem value="es">🇪🇸 {t.preferences.spanish}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t.preferences.appearance}
              </CardTitle>
              <CardDescription>
                {t.preferences.appearanceDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-3">
                <Label htmlFor="theme">{t.preferences.theme}</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    {t.preferences.light}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    {t.preferences.dark}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.preferences.themeDescription}
                </p>
              </div>

              <Separator />

              {/* Color Scheme */}
              <div className="space-y-3">
                <Label>{t.preferences.colorScheme}</Label>
                <div className="flex items-center gap-4">
                  <ColorSchemePicker />
                  <p className="text-sm text-muted-foreground">
                    {t.preferences.colorSchemeDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t.preferences.notifications}
              </CardTitle>
              <CardDescription>
                {t.preferences.notificationsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Signal Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="signal-notifications">{t.preferences.pushNotifications}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.preferences.pushNotificationsDescription}
                  </p>
                </div>
                <Switch
                  id="signal-notifications"
                  checked={preferences.signalNotifications}
                  onCheckedChange={setSignalNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Features Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t.preferences.aiFeatures || 'AI Features'}
              </CardTitle>
              <CardDescription>
                {t.preferences.aiFeaturesDescription || 'Configure AI-powered features for your trading signals'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Insights Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="ai-insights">{t.preferences.aiInsights || 'AI Insights'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.preferences.aiInsightsDescription || 'Include AI-generated analysis and insights in your Discord/Slack alerts'}
                  </p>
                </div>
                <Switch
                  id="ai-insights"
                  checked={preferences.aiInsightsEnabled}
                  onCheckedChange={setAiInsightsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.preferences.display}
              </CardTitle>
              <CardDescription>
                {t.preferences.displayDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency */}
              <div className="space-y-3">
                <Label htmlFor="currency">{t.preferences.currency}</Label>
                <Select
                  value={preferences.currency}
                  onValueChange={(value) => setCurrency(value as Currency)}
                >
                  <SelectTrigger id="currency" className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                    <SelectItem value="BTC">BTC - Bitcoin (₿)</SelectItem>
                    <SelectItem value="ETH">ETH - Ethereum (Ξ)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t.preferences.currencyDescription}
                </p>
              </div>

              <Separator />

              {/* Date Format */}
              <div className="space-y-3">
                <Label htmlFor="dateFormat">{t.preferences.dateFormat}</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => setDateFormat(value as DateFormat)}
                >
                  <SelectTrigger id="dateFormat" className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g., 01/08/2026)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g., 08/01/2026)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2026-01-08)</SelectItem>
                    <SelectItem value="DD MMM YYYY">DD MMM YYYY (e.g., 08 Jan 2026)</SelectItem>
                    <SelectItem value="MMM DD, YYYY">MMM DD, YYYY (e.g., Jan 08, 2026)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t.preferences.dateFormatDescription}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {t.common.save}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Preferences;

