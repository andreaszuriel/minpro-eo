'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Shield,
  Cookie,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  ServerOff,
  Database,
  MessageSquare,
  User,
  Trash2,
  Globe,
  CalendarX,
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function PoliciesPage() {
  const [activeSection, setActiveSection] = useState<string | null>('terms');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    terms1: true,
    terms2: false,
    terms3: false,
    terms4: false,
    privacy1: true,
    privacy2: false,
    privacy3: false,
    privacy4: false,
    cookies1: true,
    cookies2: false,
    cookies3: false,
    cookies4: false
  });

  const toggleSection = (section: string) => {
    setActiveSection(section);
  };

  const toggleItem = (item: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const renderSectionTitle = (title: string, icon: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 flex items-center justify-center"
    >
      <div className="inline-flex transform items-center gap-3 bg-tertiary-400 px-6 py-3 text-3xl font-black uppercase tracking-wider text-black shadow-lg md:text-4xl lg:text-5xl -skew-x-6">
        {icon}
        <span>{title}</span>
      </div>
    </motion.div>
  );

  const renderAccordionItem = (id: string, title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <div className="mb-4 overflow-hidden border-2 border-gray-700 bg-gray-900 transition-all duration-300 hover:border-tertiary-400">
      <button
        onClick={() => toggleItem(id)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-tertiary-400">{icon}</span>
          <h3 className="text-xl font-bold uppercase text-primary-500">{title}</h3>
        </div>
        <span className="text-tertiary-400">
          {expandedItems[id] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </span>
      </button>
      {expandedItems[id] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t-2 border-gray-700 p-4 text-gray-300"
        >
          {content}
        </motion.div>
      )}
    </div>
  );

  const lastUpdated = "May 8, 2025";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 py-24 text-center md:py-32">
        <div className="absolute left-0 top-0 h-full w-full opacity-40">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-black/60 to-black"></div>
          <Image
            src="/api/placeholder/1600/500"
            alt="Concert crowd blurred"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white sm:text-6xl md:text-8xl">
              <span className="text-shadow-hard block text-tertiary-400">Legal</span>
              <span className="text-shadow-hard-primary -mt-2 block text-primary-500 sm:-mt-3 md:-mt-5">Policies</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
              Everything you need to know about using LiveWave's services.
              <br />Last updated: {lastUpdated}
            </p>
            <div className="mt-6 h-1 w-2/3 max-w-xs mx-auto bg-gradient-to-r from-tertiary-500 via-primary-500 to-purple-600"></div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-gray-800 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => toggleSection('terms')}
              className={`flex items-center gap-2 px-6 py-3 text-lg font-bold uppercase ${
                activeSection === 'terms'
                  ? 'bg-tertiary-400 text-black hover:bg-tertiary-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText size={20} />
              Terms of Service
            </Button>
            <Button
              onClick={() => toggleSection('privacy')}
              className={`flex items-center gap-2 px-6 py-3 text-lg font-bold uppercase ${
                activeSection === 'privacy'
                  ? 'bg-tertiary-400 text-black hover:bg-tertiary-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Shield size={20} />
              Privacy Policy
            </Button>
            <Button
              onClick={() => toggleSection('cookies')}
              className={`flex items-center gap-2 px-6 py-3 text-lg font-bold uppercase ${
                activeSection === 'cookies'
                  ? 'bg-tertiary-400 text-black hover:bg-tertiary-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Cookie size={20} />
              Cookies Policy
            </Button>
          </div>
        </div>
      </section>

      {/* Terms of Service Section */}
      <section
        className={`py-16 md:py-20 ${activeSection === 'terms' ? 'block' : 'hidden'}`}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {renderSectionTitle('Terms of Service', <FileText size={36} />)}
          
          <div className="space-y-6">
            {renderAccordionItem(
              'terms1',
              'ACCEPTANCE OF TERMS',
              <AlertCircle size={24} />,
              <div className="space-y-4">
                <p>
                  By accessing or using LiveWave's website, mobile application, or any other services provided by LiveWave (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.
                </p>
                <p>
                  LiveWave reserves the right to update these Terms of Service at any time. We will notify users of any significant changes by posting a notice on our website or by sending an email to the address associated with your account. Your continued use of the Services after such modifications constitutes your acceptance of the revised Terms.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'terms2',
              'USER ACCOUNTS & RESPONSIBILITIES',
              <User size={24} />,
              <div className="space-y-4">
                <p>
                  To access certain features of the Services, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                <p>
                  You agree to:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Provide accurate and complete information when creating your account</li>
                  <li>Update your information to keep it accurate and current</li>
                  <li>Notify LiveWave immediately of any unauthorized use of your account</li>
                  <li>Not share your account credentials with any third party</li>
                  <li>Not create more than one account per person</li>
                </ul>
                <p>
                  LiveWave reserves the right to terminate or suspend accounts that violate these Terms of Service or that have been inactive for an extended period.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'terms3',
              'EVENTS & TICKETING',
              <Ticket size={24} />,
              <div className="space-y-4">
                <p>
                  LiveWave facilitates the creation, promotion, and ticketing of events. When purchasing tickets through our Services, you agree to:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Pay all applicable fees and taxes associated with your purchase</li>
                  <li>Not reproduce, transfer, or resell tickets without our explicit permission</li>
                  <li>Present valid identification if required for entry</li>
                  <li>Comply with the specific terms and conditions of the event organizer</li>
                </ul>
                <p>
                  Refunds and exchanges are subject to the policy of the specific event organizer. LiveWave is not responsible for event cancellations, postponements, or lineup changes.
                </p>
                <p>
                  For event organizers, you agree to:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Provide accurate information about your event</li>
                  <li>Fulfill all advertised promises to attendees</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not discriminate against attendees based on protected characteristics</li>
                </ul>
              </div>
            )}
            
            {renderAccordionItem(
              'terms4',
              'LIMITATION OF LIABILITY',
              <ServerOff size={24} />,
              <div className="space-y-4">
                <p>
                  LiveWave is not liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our Services.
                </p>
                <p>
                  We do not guarantee that:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>The Services will be error-free or uninterrupted</li>
                  <li>Any specific event will take place as advertised</li>
                  <li>The actions or conduct of event organizers or attendees will meet your expectations</li>
                </ul>
                <p>
                  Our total liability to you for any claim arising out of or relating to these Terms of Service or your use of the Services will not exceed the amount you paid to LiveWave in the 12 months preceding the claim.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'terms5',
              'DISPUTE RESOLUTION',
              <MessageSquare size={24} />,
              <div className="space-y-4">
                <p>
                  If you have a dispute with LiveWave, please contact us first at <span className="text-tertiary-400">legal@livewave.example.com</span> and attempt to resolve the dispute informally.
                </p>
                <p>
                  Any dispute that cannot be resolved informally will be resolved by binding arbitration under the laws of the Republic of Indonesia. The arbitration will take place in Jakarta, Indonesia.
                </p>
                <p>
                  You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Privacy Policy Section */}
      <section
        className={`py-16 md:py-20 ${activeSection === 'privacy' ? 'block' : 'hidden'}`}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {renderSectionTitle('Privacy Policy', <Shield size={36} />)}
          
          <div className="space-y-6">
            {renderAccordionItem(
              'privacy1',
              'INFORMATION WE COLLECT',
              <Database size={24} />,
              <div className="space-y-4">
                <p>
                  LiveWave collects the following types of information:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <span className="font-bold text-tertiary-400">Account Information:</span>{' '}
                    Name, email address, password, phone number, and profile image
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Transaction Information:</span>{' '}
                    Purchase history, payment details, and billing address
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Usage Information:</span>{' '}
                    How you interact with our Services, browser type, IP address, and device information
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Location Information:</span>{' '}
                    General location based on IP address and precise location if you grant permission
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Communications:</span>{' '}
                    Messages you exchange with LiveWave or other users through our platform
                  </li>
                </ul>
              </div>
            )}
            
            {renderAccordionItem(
              'privacy2',
              'HOW WE USE YOUR INFORMATION',
              <Eye size={24} />,
              <div className="space-y-4">
                <p>
                  We use your information for the following purposes:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Providing, maintaining, and improving our Services</li>
                  <li>Processing transactions and sending related information</li>
                  <li>Sending promotional communications about events and offers</li>
                  <li>Responding to your comments, questions, and customer service requests</li>
                  <li>Monitoring and analyzing trends, usage, and activities</li>
                  <li>Detecting, investigating, and preventing fraudulent transactions and other illegal activities</li>
                  <li>Personalizing your experience by providing content and recommendations</li>
                </ul>
                <p>
                  LiveWave does not sell your personal information to third parties.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'privacy3',
              'INFORMATION SHARING',
              <Globe size={24} />,
              <div className="space-y-4">
                <p>
                  We may share your information in the following circumstances:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <span className="font-bold text-tertiary-400">Event Organizers:</span>{' '}
                    When you purchase tickets, your information will be shared with the event organizer as necessary to facilitate your attendance
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Service Providers:</span>{' '}
                    With vendors, consultants, and other service providers who need access to your information to perform services on our behalf
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Legal Requirements:</span>{' '}
                    When required by law, subpoena, or other legal process, or if we have a good faith belief that disclosure is necessary to protect the rights, property, or safety of LiveWave, our users, or the public
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Business Transfers:</span>{' '}
                    In connection with a merger, acquisition, bankruptcy, or other sale of all or a portion of our business
                  </li>
                </ul>
                <p>
                  We limit the information shared to what is necessary for the specific purpose and require recipients to protect your information.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'privacy4',
              'YOUR RIGHTS & CHOICES',
              <Lock size={24} />,
              <div className="space-y-4">
                <p>
                  You have the following rights regarding your personal information:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Update or correct inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Object to the processing of your personal information</li>
                </ul>
                <p>
                  To exercise these rights, please contact us at <span className="text-tertiary-400">privacy@livewave.example.com</span>. We will respond to your request within 30 days.
                </p>
                <p>
                  Please note that some information may be retained as required by law or for legitimate business purposes.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'privacy5',
              'DATA RETENTION & SECURITY',
              <Trash2 size={24} />,
              <div className="space-y-4">
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes for which it was collected and to comply with legal obligations.
                </p>
                <p>
                  LiveWave takes reasonable measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
                <p>
                  In the event of a data breach that affects your personal information, we will notify you in accordance with applicable law.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Cookies Policy Section */}
      <section
        className={`py-16 md:py-20 ${activeSection === 'cookies' ? 'block' : 'hidden'}`}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {renderSectionTitle('Cookies Policy', <Cookie size={36} />)}
          
          <div className="space-y-6">
            {renderAccordionItem(
              'cookies1',
              'WHAT ARE COOKIES',
              <Cookie size={24} />,
              <div className="space-y-4">
                <p>
                  Cookies are small text files that are stored on your device when you visit a website. They help us recognize your device and provide a more personalized experience.
                </p>
                <p>
                  LiveWave uses cookies and similar technologies, such as web beacons and local storage, to enhance your experience on our platform.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'cookies2',
              'TYPES OF COOKIES WE USE',
              <Database size={24} />,
              <div className="space-y-4">
                <p>
                  LiveWave uses the following types of cookies:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <span className="font-bold text-tertiary-400">Essential Cookies:</span>{' '}
                    Required for the basic functionality of our Services, such as authentication, security, and remembering your preferences
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Analytics Cookies:</span>{' '}
                    Help us understand how visitors interact with our Services by collecting and reporting information anonymously
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Functional Cookies:</span>{' '}
                    Allow us to remember choices you make and provide enhanced, personalized features
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Advertising Cookies:</span>{' '}
                    Used to deliver relevant advertisements based on your interests and to measure the effectiveness of our advertising campaigns
                  </li>
                </ul>
              </div>
            )}
            
            {renderAccordionItem(
              'cookies3',
              'YOUR COOKIE CHOICES',
              <CheckCircle size={24} />,
              <div className="space-y-4">
                <p>
                  You can control and manage cookies in various ways:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <span className="font-bold text-tertiary-400">Browser Settings:</span>{' '}
                    Most web browsers allow you to manage cookies through their settings. You can set your browser to block or alert you about cookies
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Cookie Consent Tool:</span>{' '}
                    We provide a cookie consent tool when you first visit our website, allowing you to select which types of cookies you want to allow
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Opt-Out Links:</span>{' '}
                    Some third-party advertising networks provide opt-out mechanisms
                  </li>
                </ul>
                <p>
                  Please note that blocking all cookies may impact your experience on our website and limit certain features.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'cookies4',
              'THIRD-PARTY COOKIES',
              <Globe size={24} />,
              <div className="space-y-4">
                <p>
                  Some cookies are placed by third parties on our website:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <span className="font-bold text-tertiary-400">Analytics Providers:</span>{' '}
                    Such as Google Analytics, to help us understand how users engage with our Services
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Social Media Platforms:</span>{' '}
                    When you share content or log in using your social media accounts
                  </li>
                  <li>
                    <span className="font-bold text-tertiary-400">Payment Processors:</span>{' '}
                    To facilitate secure transactions
                  </li>
                </ul>
                <p>
                  These third parties may use cookies for their own purposes. We encourage you to review their privacy policies to understand how they use your information.
                </p>
              </div>
            )}
            
            {renderAccordionItem(
              'cookies5',
              'UPDATES TO THIS POLICY',
              <Clock size={24} />,
              <div className="space-y-4">
                <p>
                  We may update our Cookies Policy from time to time to reflect changes in technology, regulation, or our business practices.
                </p>
                <p>
                  We will notify you of any material changes by posting the new Cookies Policy on our website and updating the "Last Updated" date.
                </p>
                <p>
                  Your continued use of our Services after any changes to this Cookies Policy constitutes your acceptance of the updated policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Call To Action */}
      <section className="bg-black py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-none border-4 border-primary-500 bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-12">
            <div className="absolute -right-12 -top-12 opacity-10">
              <MessageSquare className="h-48 w-48 text-tertiary-400" />
            </div>
            
            <div className="relative z-10 text-center md:text-left">
              <div className="md:flex md:items-center md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-2xl font-black uppercase text-tertiary-400 md:text-3xl lg:text-4xl">Still Have Questions?</h2>
                  <p className="mt-2 text-lg text-gray-300">
                    Our team is here to help with any questions about our policies or services.
                  </p>
                </div>
                
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 md:flex-shrink-0">
                 
<Link href="/about" passHref>
  <Button className="bg-tertiary-400 px-8 py-3 text-lg font-bold uppercase text-black transition-transform hover:scale-105 hover:bg-tertiary-300">
    Contact Support
  </Button>
</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Global Styles */}
      <style jsx global>{`
        .text-shadow-hard {
          text-shadow: 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000;
        }
        .text-shadow-hard-primary {
          text-shadow: 2px 2px 0px #4a044e, -2px -2px 0px #4a044e, 2px -2px 0px #4a044e, -2px 2px 0px #4a044e;
        }
      `}</style>
    </div>
  );
}