'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { SalesforceEventPayload } from '@/types/salesforce';

interface EventLog {
    timestamp: number;
    message: string;
    success: boolean;
}

export default function SalesforceDebugPanel() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [events, setEvents] = useState<EventLog[]>([]);

    useEffect(() => {
        // Check if Salesforce is loaded
        const checkSalesforce = setInterval(() => {
            if (typeof window !== 'undefined' && window.SalesforceInteractions) {
                setIsLoaded(true);
                clearInterval(checkSalesforce);
            }
        }, 500);

        return () => clearInterval(checkSalesforce);
    }, []);

    const testEvent = (): void => {
        if (window.SalesforceInteractions) {
            const eventName = `test_event_${Date.now()}`;
            try {
                const payload: SalesforceEventPayload = {
                    interaction: {
                        eventType: 'website',
                        category: 'Debug',
                        name: eventName,
                    },
                };
                window.SalesforceInteractions.sendEvent(payload);
                setEvents(prev => [
                    { timestamp: Date.now(), message: eventName, success: true },
                    ...prev
                ].slice(0, 10));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setEvents(prev => [
                    { timestamp: Date.now(), message: `Error: ${errorMessage}`, success: false },
                    ...prev
                ].slice(0, 10));
            }
        }
    };

    const clearEvents = (): void => {
        setEvents([]);
    };

    const hasC360a = typeof window !== 'undefined' && Boolean(window.c360a);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition flex items-center space-x-2"
            >
                <Activity className="w-5 h-5" />
                <span className="font-medium">SF Tracking</span>
                {isLoaded ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                )}
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Debug Panel */}
            {isOpen && (
                <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden flex flex-col">
                    <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Activity className="w-5 h-5" />
                            <span className="font-bold">Salesforce Debug</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isLoaded ? (
                                <span className="text-xs bg-green-500 px-2 py-1 rounded">LOADED</span>
                            ) : (
                                <span className="text-xs bg-red-500 px-2 py-1 rounded">NOT LOADED</span>
                            )}
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                            <h4 className="text-xs font-bold text-gray-700 mb-2">Status</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span>SalesforceInteractions:</span>
                                    <span className={isLoaded ? 'text-green-600 font-bold' : 'text-red-600'}>
                                        {isLoaded ? '✓ Available' : '✗ Not Available'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>c360a:</span>
                                    <span className={hasC360a ? 'text-green-600 font-bold' : 'text-red-600'}>
                                        {hasC360a ? '✓ Available' : '✗ Not Available'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={testEvent}
                                disabled={!isLoaded}
                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                            >
                                Send Test Event
                            </button>
                            <button
                                onClick={clearEvents}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition"
                            >
                                Clear
                            </button>
                        </div>

                        {events.length > 0 && (
                            <div className="bg-gray-50 rounded border border-gray-200 p-2 max-h-40 overflow-y-auto">
                                <h4 className="text-xs font-bold text-gray-700 mb-2">Event Log</h4>
                                <div className="space-y-1">
                                    {events.map((event, index) => (
                                        <div
                                            key={`${event.timestamp}-${index}`}
                                            className={`text-xs font-mono px-2 py-1 rounded ${event.success
                                                ? 'bg-white text-gray-600'
                                                : 'bg-red-50 text-red-600'
                                                }`}
                                        >
                                            {event.success ? '✅' : '❌'} {event.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isLoaded && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                                ⚠️ Waiting for Salesforce to load... Check console for errors.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}