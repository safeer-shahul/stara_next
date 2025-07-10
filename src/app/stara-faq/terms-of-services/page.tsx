// pages/terms-of-service.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { NextPage } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Stara Jewels',
  description: 'Terms of Service for Stara Jewels',
};

const TermsOfService: NextPage = () => {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last Updated: July 10, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to Stara Jewels. These Terms of Service govern your use of our website 
              and the purchase and use of products and services offered through the Website. By accessing our Website and/or making a purchase, 
              you agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Account Terms</h2>
            <p>
              When you create an account with us, you guarantee the information you provide is accurate, 
              complete, and current. You are responsible for maintaining the confidentiality of your account 
              and password. You accept responsibility for all activities that occur under your account or password.
            </p>
            <p>
              We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel 
              orders at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Product Terms</h2>
            <p>
              All our silver jewelry products are crafted with genuine sterling silver (925). Product weights 
              and dimensions may slightly vary due to the handcrafted nature of our jewelry. Stone colors may 
              appear differently depending on lighting conditions and display settings.
            </p>
            <p>
              Product availability is not guaranteed. We reserve the right to discontinue any product at any 
              time. If a product is unavailable after you place your order, we will notify you and provide 
              options for substitution or replacement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p>
              All prices are listed in Indian Rupees (₹) and are subject to change without notice. We reserve the 
              right to correct pricing errors at any time.
            </p>
            <p>
              We accept payments through Razorpay payment gateway, which supports credit/debit cards, UPI, net banking, and various wallets. All payments are processed securely through Razorpay. We do not store your payment details on our servers.
            </p>
            <p>
              By placing an order, you represent and warrant that you are authorized to use the designated 
              payment method and you authorize us to charge your order to that payment method.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Order Terms</h2>
            <p>
              Your receipt of an order confirmation does not constitute our acceptance of your order. We 
              reserve the right to accept or reject your order for any reason, including product availability, 
              errors in pricing information, or suspected fraudulent activity.
            </p>
            <p>
              We will notify you by email if all or part of your order is canceled or if additional information 
              is required to accept your order.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Shipping Terms</h2>
            <p>
              We provide free shipping on all orders within India through our delivery partner Delhivery. 
              Delivery timelines are estimates only and are not guaranteed. We currently ship within India only.
            </p>
            <p>
              Risk of loss and title for items pass to you upon delivery of the items to the carrier. You are 
              responsible for filing any claims with carriers for damaged and/or lost shipments.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Replacement Terms</h2>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="font-semibold text-yellow-800">
                Important: Stara Jewels does not offer returns or refunds. We only provide replacements under specific conditions.
              </p>
            </div>
            <p>
              Replacement requests are accepted only within 3 days of delivery. Items must be 
              unworn, in original condition with all tags attached. Custom-made or personalized items cannot 
              be replaced. You can only request replacement once per order, and all requests are subject to admin approval.
            </p>
            <p>
              Please refer to our separate Replacement Policy for complete details on eligibility, process, and terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property Terms</h2>
            <p>
              All content on the Website including text, graphics, logos, images, and software is the property 
              of Stara Jewels or its suppliers and is protected by copyright and intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, display, sell, lease, transmit, create derivative works from, 
              translate, modify, reverse-engineer, disassemble, decompile, or otherwise exploit this Website 
              or any portion of it without our explicit written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. User Content Terms</h2>
            <p>
              By submitting reviews, comments, or other content to our Website, you grant Stara Jewels a 
              non-exclusive, royalty-free, perpetual, irrevocable right to use, reproduce, modify, adapt, 
              publish, and display such content throughout the world in any media.
            </p>
            <p>
              You represent that you own all rights to the content you post and that the content does not 
              violate these Terms of Service or cause injury to any person or entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Prohibited Use Terms</h2>
            <p>
              You may not use the Website for any unlawful purpose, to violate any regulations or laws, 
              to infringe upon intellectual property rights, to harass or harm others, to submit false 
              information, to upload malicious code, or to collect personal information of others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Liability Limitation Terms</h2>
            <p>
              Stara Jewels shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages resulting from your use or inability to use the Website or products.
            </p>
            <p>
              Our liability is limited to the maximum extent permitted by law. Where applicable law may not 
              allow the limitation of liability, the above limitations may not apply to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification Terms</h2>
            <p>
              You agree to indemnify and hold harmless Stara Jewels and its affiliates, officers, directors, 
              employees, and agents from any claims, damages, liabilities, costs, or expenses arising from 
              your violation of these Terms of Service or your use of the Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law Terms</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, 
              without regard to its conflict of law provisions. Any disputes relating to these Terms will 
              be subject to the exclusive jurisdiction of the courts in Calicut, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Modification Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective 
              immediately upon posting on the Website. Your continued use of the Website following the posting 
              of revised Terms means you accept and agree to the changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;