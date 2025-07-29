import { useState } from 'react';
import { Heart, Coffee, Music, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DonationSupportProps {
  context?: 'venue' | 'artist' | 'general';
  entityName?: string;
}

const DONATION_TIERS = [
  {
    amount: 5,
    icon: Coffee,
    title: 'Buy us a coffee',
    description: 'Help cover our server costs',
    badge: 'Supporter'
  },
  {
    amount: 15,
    icon: Music,
    title: 'Music lover',
    description: 'Support independent music discovery',
    badge: 'Music Lover'
  },
  {
    amount: 30,
    icon: Heart,
    title: 'Venue champion',
    description: 'Help us expand to more cities',
    badge: 'Champion'
  },
  {
    amount: 50,
    icon: Zap,
    title: 'Scene builder',
    description: 'Fuel the independent music ecosystem',
    badge: 'Scene Builder'
  }
];

export default function DonationSupport({ context = 'general', entityName }: DonationSupportProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleDonation = (amount: number) => {
    // In a real implementation, this would integrate with payment processors
    // like Stripe, PayPal, or crypto wallets
    console.log(`Processing donation: $${amount}`);
    
    // Analytics tracking
    const eventData = {
      amount,
      context,
      entityName,
      timestamp: new Date().toISOString()
    };
    
    // Track donation attempt
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'donation_initiated', {
        currency: 'USD',
        value: amount,
        context,
        entity_name: entityName
      });
    }

    // Redirect to payment processor (mock URL)
    const paymentUrl = new URL('https://donate.stripe.com/tinyamp');
    paymentUrl.searchParams.set('amount', (amount * 100).toString()); // Convert to cents
    paymentUrl.searchParams.set('context', context);
    if (entityName) {
      paymentUrl.searchParams.set('entity', entityName);
    }
    
    window.open(paymentUrl.toString(), '_blank');
  };

  const getContextMessage = () => {
    switch (context) {
      case 'venue':
        return `Support ${entityName} and independent venues`;
      case 'artist':
        return `Support ${entityName} and emerging artists`;
      default:
        return 'Support TinyAmp and independent music discovery';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Support Independent Music
        </CardTitle>
        <p className="text-sm text-gray-600">
          {getContextMessage()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preset donation amounts */}
        <div className="grid grid-cols-2 gap-3">
          {DONATION_TIERS.map((tier) => (
            <Button
              key={tier.amount}
              variant={selectedAmount === tier.amount ? "default" : "outline"}
              className="h-auto p-3 flex flex-col items-center gap-2"
              onClick={() => setSelectedAmount(tier.amount)}
            >
              <tier.icon className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold">${tier.amount}</div>
                <div className="text-xs opacity-80">{tier.title}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Custom amount input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom amount</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
              $
            </span>
            <input
              type="number"
              min="1"
              placeholder="Enter amount"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Donation button */}
        <Button
          onClick={() => {
            const amount = selectedAmount || parseFloat(customAmount);
            if (amount && amount > 0) {
              handleDonation(amount);
            }
          }}
          disabled={!selectedAmount && !customAmount}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          Donate {selectedAmount ? `$${selectedAmount}` : customAmount ? `$${customAmount}` : ''}
        </Button>

        {/* Benefits display */}
        {selectedAmount && (
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Badge variant="secondary" className="mb-2">
              {DONATION_TIERS.find(t => t.amount === selectedAmount)?.badge}
            </Badge>
            <p className="text-xs text-gray-600">
              {DONATION_TIERS.find(t => t.amount === selectedAmount)?.description}
            </p>
          </div>
        )}

        {/* Impact message */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🎵 Your support helps us:</p>
          <ul className="text-left space-y-1 pl-4">
            <li>• Discover new independent venues</li>
            <li>• Expand to more cities</li>
            <li>• Keep the platform ad-free</li>
            <li>• Support emerging artists</li>
          </ul>
        </div>

        {/* Payment options */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">Secure payment via</p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-xs">Stripe</Badge>
            <Badge variant="outline" className="text-xs">PayPal</Badge>
            <Badge variant="outline" className="text-xs">Crypto</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}