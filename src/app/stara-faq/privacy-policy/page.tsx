import React from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Stara Jewels',
  description: 'Privacy Policy for Stara Jewels',
};

const PrivacyPolicy: NextPage = () => {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last Updated: July 10, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              At Stara Jewels, we respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our website or make a purchase from us.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our website, you acknowledge 
              that you have read, understood, and agree to be bound by all the terms outlined in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p>
              We may collect the following types of information:
            </p>
            <h3 className="text-xl font-semibold mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-8 my-4">
              <li>Contact information (name, email address, phone number, shipping and billing address)</li>
              <li>Account information (username, password)</li>
              <li>Payment information (credit card details, banking information)</li>
              <li>Purchase history and preferences</li>
              <li>Communications with us (including customer service inquiries)</li>
              <li>Order-related information (replacement requests, warranty claims)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Non-Personal Information</h3>
            <ul className="list-disc pl-8 my-4">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>IP address</li>
              <li>Device information</li>
              <li>Browsing patterns and website usage</li>
              <li>Referring website or source</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Collect Information</h2>
            <p>
              We collect information through:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Direct interactions (when you create an account, make a purchase, or contact us)</li>
              <li>Order management (including replacement requests and customer service interactions)</li>
              <li>Automated technologies (cookies, web beacons, pixels)</li>
              <li>Third-party sources (payment processors, social media platforms, analytics providers)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p>
              We may use your information for the following purposes:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Process and fulfill your orders</li>
              <li>Create and manage your account</li>
              <li>Handle replacement requests and warranty claims</li>
              <li>Provide customer service and support</li>
              <li>Send transactional emails (order confirmations, shipping updates, replacement status)</li>
              <li>Send marketing communications (if you've opted in)</li>
              <li>Improve our website, products, and services</li>
              <li>Analyze usage patterns and trends</li>
              <li>Prevent fraudulent transactions and monitor against theft</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect information about your browsing 
              activities on our website. Cookies are small text files stored on your device that help us 
              provide you with a better browsing experience.
            </p>
            <p>
              Types of cookies we use:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
              <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytical cookies:</strong> Collect information about how you use our website</li>
              <li><strong>Marketing cookies:</strong> Track your browsing habits to deliver targeted advertising</li>
            </ul>
            <p>
              You can manage your cookie preferences through your browser settings. However, disabling certain 
              cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Sharing Your Information</h2>
            <p>
              We may share your information with:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Service providers:</strong> Payment processors, shipping companies (including our delivery partner Delhivery), and cloud service providers</li>
              <li><strong>Business partners:</strong> Marketing partners and affiliates</li>
              <li><strong>Admin team:</strong> For processing replacement requests, warranty claims, and customer service</li>
              <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information from 
              unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Secure Socket Layer (SSL) encryption for data transmission</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication procedures</li>
              <li>Data minimization practices</li>
              <li>Secure handling of replacement request documentation and images</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. 
              While we strive to use commercially acceptable means to protect your personal information, 
              we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined 
              in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <p>
              For example, we may retain:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Account information for as long as your account is active</li>
              <li>Transaction data for tax and accounting purposes</li>
              <li>Customer service communications for quality assurance</li>
              <li>Replacement request documentation for warranty and quality control purposes</li>
              <li>Order history for customer service and business analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Right to access your personal information</li>
              <li>Right to correct inaccurate or incomplete information</li>
              <li>Right to delete your personal information</li>
              <li>Right to restrict or object to processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than the one in which 
              you reside. These countries may have different data protection laws than your country of residence.
            </p>
            <p>
              We ensure that appropriate safeguards are in place to protect your personal information 
              when transferring it internationally, in compliance with applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
            <p>
              Our website is not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If we learn that we have collected personal information 
              from a child without parental consent, we will take steps to delete that information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to this Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              for other operational, legal, or regulatory reasons. The updated version will be effective 
              as of the date it is posted on our website.
            </p>
            <p>
              We encourage you to review this Privacy Policy periodically to stay informed about how we 
              are protecting your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our 
              privacy practices, please contact us at:
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Stara Jewels</p>
              <p>Third Floor, Nalonkandy Arcade,</p>
              <p>Pushpa Junction, Calicut, India 673002</p>
              <p className="mt-2">
                <strong>Email:</strong> starajewels@gmail.com
              </p>
              <p>
                <strong>Phone:</strong> +91 80869 25925
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 mb-6 text-center">
          <Link href="/" className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">
            Return to Home
          </Link>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;