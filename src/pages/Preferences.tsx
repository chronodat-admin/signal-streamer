import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Moon, Sun, Save, DollarSign, Calendar } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { usePreferences, type Currency, type DateFormat } from '@/hooks/usePreferences';
import { toast } from '@/hooks/use-toast';

const Preferences = () => {
  const { theme, setTheme } = useTheme();
  const { preferences, setCurrency, setDateFormat } = usePreferences();

  const handleSave = () => {
    toast({
      title: 'Preferences saved',
      description: 'Your preferences have been saved successfully.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Preferences</h1>
          <p className="text-muted-foreground text-lg">Customize your app experience</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-3">
                <Label htmlFor="theme">Theme</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark mode
                </p>
              </div>

              <Separator />

              {/* Color Scheme */}
              <div className="space-y-3">
                <Label>Color Scheme</Label>
                <div className="flex items-center gap-4">
                  <ColorSchemePicker />
                  <p className="text-sm text-muted-foreground">
                    Select your preferred color scheme
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Customize currency and date formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency */}
              <div className="space-y-3">
                <Label htmlFor="currency">Currency</Label>
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
                  Currency used for displaying prices and amounts
                </p>
              </div>

              <Separator />

              {/* Date Format */}
              <div className="space-y-3">
                <Label htmlFor="dateFormat">Date Format</Label>
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
                  Format used for displaying dates throughout the application
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Preferences;

