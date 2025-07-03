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
          <p className="text-gray-600">Last Updated: April 15, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Domestic Shipping</h2>
            <p>
              Stara Jewels offers shipping for domestic orders via our delivery partner Delhivery.
            </p>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Standard Shipping:</strong> 5-7 business days (₹150)</li>
            </ul>
            <p>
              Orders over ₹3,000 qualify for free shipping. All orders are processed within 
              1-2 business days after payment confirmation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Shipping</h2>
            <p>
              We ship to most countries worldwide through our delivery partner Delhivery. International shipping rates are calculated at checkout 
              based on destination and weight:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Standard International:</strong> 10-15 business days (rates vary by location)</li>
            </ul>
            <p>
              Please note that international orders may be subject to import duties, taxes, and customs 
              clearance fees imposed by the destination country. These charges are the responsibility of 
              the recipient and are not included in our shipping fees.
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
              Additionally, some international destinations may have restrictions on 
              importing jewelry. Please check your local customs regulations before placing an order.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Packaging</h2>
            <p>
              All Stara Jewels items are carefully packaged in our signature gift boxes, secured with 
              protective materials to prevent damage during transit. Each order includes:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Signature Stara Jewels gift box</li>
              <li>Jewelry care instruction card</li>
              <li>Authentication certificate for select pieces</li>
              <li>Silver polishing cloth with orders over $75</li>
            </ul>
            <p>
              If you're purchasing a gift, you can add a personalized gift message at checkout at no 
              additional cost.
            </p>
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
            <div className="mt-4">
              <p>Stara Jewels</p>
              <p>Third Floor, Nalonkandy Arcade,
              Pushpa Junction, Calicut, India 673002</p>
              <p>Email: starajewels@gmail.com</p>
              <p>Phone: +91 80869 25925</p>
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