// pages/shipping-handling.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { NextPage } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping and handling | Stara Jewels',
  description: 'Shipping and handling information for Stara Jewels',
};

const ShippingAndHandling: NextPage = () => {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Shipping & Handling</h1>
          <p className="text-gray-600">Last Updated: July 10, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Free Shipping</h2>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
              <p className="font-bold text-green-800">
                🎉 Great News! We offer completely FREE shipping on all orders across India!
              </p>
            </div>
            <p>
              Stara Jewels provides free shipping for all domestic orders via our trusted delivery partner, Delhivery. 
              There are no minimum order requirements or hidden charges - all shipping is completely free.
            </p>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Delivery Time:</strong> 5-7 business days</li>
              <li><strong>Delivery Partner:</strong> Delhivery</li>
              <li><strong>Shipping Cost:</strong> Free for all orders</li>
              <li><strong>Coverage:</strong> Pan-India delivery</li>
            </ul>
            <p>
              All orders are processed within 1-2 business days after payment confirmation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Tracking Information</h2>
            <p>
              All orders include tracking information which will be emailed to you once your order ships. 
              You can also view tracking information by logging into your Stara Jewels account.
            </p>
            <p>
              If you haven't received tracking information within 2 business days of your order, please 
              contact our customer service team at starajewels@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping Restrictions</h2>
            <p>
              Due to our delivery partner Delhivery's limitations, we are unable to ship to P.O. boxes. 
              Please ensure you provide a complete physical address for successful delivery.
            </p>
            <p>
              We currently ship within India only. For any special delivery requirements or remote locations, 
              please contact our customer service team before placing your order.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Packaging</h2>
            <p>
              All Stara Jewels items are carefully packaged in secure boxes, with protective materials 
              to prevent damage during transit. Each order includes:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Secure Stara Jewels packaging box</li>
              <li>Jewelry care instruction card</li>
              {/* <li>Authentication certificate for select pieces</li> */}
              {/* <li>Silver polishing cloth with premium orders</li> */}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Delivery Process</h2>
            <p>
              Our delivery partner Delhivery ensures safe and secure delivery of your orders. Here's what to expect:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Orders are processed within 1-2 business days</li>
              <li>You'll receive tracking information via email and SMS</li>
              <li>Delivery attempts are made during business hours</li>
              <li>Signature confirmation required for all jewelry deliveries</li>
              <li>Multiple delivery attempts will be made if recipient is unavailable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Delivery Issues</h2>
            <p>
              In the rare event that your package is lost, damaged, or significantly delayed, please 
              contact our customer service team immediately at starajewels@gmail.com or +91 80869 25925.
            </p>
            <p>
              Our delivery partner Delhivery provides tracking for all shipments. For packages marked as delivered but not received, 
              you must contact us within 48 hours of the delivery confirmation to assist with package tracing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have any questions about shipping or handling, please contact us at:
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

export default ShippingAndHandling;