import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorScheme {
  name: string;
  hue: number;
  saturation: number;
  lightness: number;
  preview: string;
}

const colorSchemes: ColorScheme[] = [
  { name: 'Green', hue: 142, saturation: 71, lightness: 45, preview: 'bg-[hsl(142,71%,45%)]' },
  { name: 'Blue', hue: 199, saturation: 89, lightness: 48, preview: 'bg-[hsl(199,89%,48%)]' },
  { name: 'Cyan', hue: 185, saturation: 84, lightness: 45, preview: 'bg-[hsl(185,84%,45%)]' },
  { name: 'Emerald', hue: 160, saturation: 84, lightness: 39, preview: 'bg-[hsl(160,84%,39%)]' },
  { name: 'Violet', hue: 270, saturation: 70, lightness: 55, preview: 'bg-[hsl(270,70%,55%)]' },
  { name: 'Rose', hue: 345, saturation: 82, lightness: 55, preview: 'bg-[hsl(345,82%,55%)]' },
  { name: 'Orange', hue: 25, saturation: 95, lightness: 53, preview: 'bg-[hsl(25,95%,53%)]' },
  { name: 'Indigo', hue: 240, saturation: 70, lightness: 55, preview: 'bg-[hsl(240,70%,55%)]' },
  { name: 'Amber', hue: 38, saturation: 92, lightness: 50, preview: 'bg-[hsl(38,92%,50%)]' },
];

export const ColorSchemePicker = () => {
  const [currentScheme, setCurrentScheme] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signalpulse-color-scheme');
      if (saved) {
        const parsed = JSON.parse(saved);
        return colorSchemes.find(s => s.name === parsed.name) || colorSchemes[0];
      }
    }
    // Default to Green (Supabase-style)
    return colorSchemes.find(s => s.name === 'Green') || colorSchemes[0];
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyColorScheme(currentScheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyColorScheme = (scheme: ColorScheme) => {
    const root = document.documentElement;
    root.style.setProperty('--brand-hue', String(scheme.hue));
    root.style.setProperty('--brand-saturation', `${scheme.saturation}%`);
    root.style.setProperty('--brand-lightness', `${scheme.lightness}%`);
    
    localStorage.setItem('signalpulse-color-scheme', JSON.stringify(scheme));
    setCurrentScheme(scheme);
  };

  const handleSelect = (scheme: ColorScheme) => {
    applyColorScheme(scheme);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Palette className="h-4 w-4" />
          <span 
            className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-background"
            style={{ backgroundColor: `hsl(${currentScheme.hue}, ${currentScheme.saturation}%, ${currentScheme.lightness}%)` }}
          />
          <span className="sr-only">Change color scheme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end" sideOffset={8}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Color Scheme</h4>
            <span className="text-xs text-muted-foreground">{currentScheme.name}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => handleSelect(scheme)}
                className={cn(
                  "group relative h-10 w-full rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  currentScheme.name === scheme.name && "ring-2 ring-ring ring-offset-2"
                )}
                style={{ backgroundColor: `hsl(${scheme.hue}, ${scheme.saturation}%, ${scheme.lightness}%)` }}
                title={scheme.name}
              >
                {currentScheme.name === scheme.name && (
                  <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                )}
                <span className="sr-only">{scheme.name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-1">
            Click to apply • Saved automatically
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
