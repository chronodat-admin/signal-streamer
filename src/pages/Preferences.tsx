import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Palette, Moon, Sun, Save } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/use-toast';

const Preferences = () => {
  const { theme, setTheme } = useTheme();

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

