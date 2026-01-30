import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { verifyOTP, sendOTP, user } = useAuth();
  
  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);

  // Navigate after successful verification
  useEffect(() => {
    if (user && user.isProfileComplete) {
      navigate('/dashboard', { replace: true });
    } else if (user && !user.isProfileComplete) {
      navigate('/complete-profile', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPComplete = async (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      await handleVerify(value);
    }
  };

  const handleVerify = async (otpValue: string) => {
    setIsLoading(true);
    
    try {
      const success = await verifyOTP(phone, otpValue);
      
      if (success) {
        toast({
          title: 'Verified Successfully',
          description: 'Welcome to CommutePal!',
        });
        // Navigation will be handled by useEffect when user state updates
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid OTP',
          description: 'Please check the code and try again.',
        });
        setOtp('');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Something went wrong. Please try again.',
      });
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      await sendOTP(phone);
      toast({
        title: 'OTP Resent',
        description: 'A new verification code has been sent.',
      });
      setResendTimer(30);
      setCanResend(false);
      setOtp('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend',
        description: 'Please try again later.',
      });
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        {/* OTP Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Verify Your Number</CardTitle>
            <CardDescription className="text-center">
              Enter the 6-digit code sent to<br />
              <span className="font-medium text-foreground">{phone}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOTPComplete}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center">
                <span className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            )}

            {/* Resend OTP */}
            <div className="text-center">
              {canResend ? (
                <Button
                  variant="ghost"
                  className="text-primary"
                  onClick={handleResendOTP}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Resend code in <span className="font-medium">{resendTimer}s</span>
                </p>
              )}
            </div>

            {/* Demo hint */}
            <p className="text-center text-sm text-muted-foreground border-t pt-4">
              Demo OTP: <span className="font-mono font-medium">123456</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
