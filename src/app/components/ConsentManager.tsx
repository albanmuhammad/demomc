'use client';

import { useState, useEffect } from 'react';
import { Shield, X, Check } from 'lucide-react';
import type { SalesforceConsent } from '@/types/salesforce';
import { sendConsentEvent } from '@/lib/salesforce-helpers';

const CONSENT_STORAGE_KEY = 'sf_user_consent';

interface ConsentPreferences {
    tracking: boolean;
    analytics: boolean;
    timestamp: number;
}

export default function ConsentManager() {
    const [showBanner, setShowBanner] = useState<boolean>(false);
    const [preferences, setPreferences] = useState<ConsentPreferences>({
        tracking: false,
        analytics: false,
        timestamp: 0
    });

    useEffect(() => {
        // Check if user has already provided consent
        const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);

        if (storedConsent) {
            const consent: ConsentPreferences = JSON.parse(storedConsent);
            setPreferences(consent);
            updateSalesforceConsent(consent);
        } else {
            // Show banner if no consent stored
            setShowBanner(true);
        }
    }, []);

    const updateSalesforceConsent = (consent: ConsentPreferences): void => {
        if (typeof window !== 'undefined' && window.SalesforceInteractions) {
            const consents: SalesforceConsent[] = [
                {
                    purpose: 'Tracking',
                    status: consent.tracking ? 'OptIn' : 'OptOut'
                },
                {
                    purpose: 'Analytics',
                    status: consent.analytics ? 'OptIn' : 'OptOut'
                }
            ];

            try {
                window.SalesforceInteractions.updateConsents(consents);
                console.log('📋 Consent updated:', consents);

                // Send consent events to Data Cloud
                sendConsentEvent({
                    purpose: 'Tracking',
                    status: consent.tracking ? 'OptIn' : 'OptOut',
                    provider: 'Website'
                });

                sendConsentEvent({
                    purpose: 'Analytics',
                    status: consent.analytics ? 'OptIn' : 'OptOut',
                    provider: 'Website'
                });
            } catch (error) {
                console.error('Error updating consent:', error);
            }
        }
    };

    const handleAcceptAll = (): void => {
        const consent: ConsentPreferences = {
            tracking: true,
            analytics: true,
            timestamp: Date.now()
        };

        saveConsent(consent);
    };

    const handleRejectAll = (): void => {
        const consent: ConsentPreferences = {
            tracking: false,
            analytics: false,
            timestamp: Date.now()
        };

        saveConsent(consent);
    };

    const handleCustomize = (tracking: boolean, analytics: boolean): void => {
        const consent: ConsentPreferences = {
            tracking,
            analytics,
            timestamp: Date.now()
        };

        saveConsent(consent);
    };

    const saveConsent = (consent: ConsentPreferences): void => {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
        setPreferences(consent);
        updateSalesforceConsent(consent);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Cookie Consent & Privacy
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            We use cookies and tracking technologies to improve your experience, analyze site usage,
                            and personalize content. Your data is tracked through Salesforce Data Cloud for analytics purposes.
                        </p>

                        <div className="space-y-2 mb-4">
                            <label className="flex items-center space-x-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={preferences.tracking}
                                    onChange={(e) => setPreferences({ ...preferences, tracking: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">
                                    <strong>Tracking Cookies</strong> - Track user interactions and behavior
                                </span>
                            </label>

                            <label className="flex items-center space-x-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={preferences.analytics}
                                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">
                                    <strong>Analytics Cookies</strong> - Help us understand usage patterns
                                </span>
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleAcceptAll}
                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                            >
                                <Check className="w-4 h-4" />
                                <span>Accept All</span>
                            </button>

                            <button
                                onClick={handleRejectAll}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition flex items-center space-x-2"
                            >
                                <X className="w-4 h-4" />
                                <span>Reject All</span>
                            </button>

                            <button
                                onClick={() => handleCustomize(preferences.tracking, preferences.analytics)}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}