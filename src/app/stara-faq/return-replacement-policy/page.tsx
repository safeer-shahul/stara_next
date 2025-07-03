import React from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return and replacement Policy | Stara Jewels',
  description: 'Return and replacement Policy for Stara Jewels',
};
const ReturnReplacementPolicy: NextPage = () => {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Return & Replacement Policy</h1>
          <p className="text-gray-600">Last Updated: April 15, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Return Period</h2>
            <p className="font-bold text-red-600">
              Stara Jewels accepts returns and replacement requests within 2 days after delivery.
            </p>
            <p>
              To be eligible for a return or replacement, you must contact our customer service team 
              within 2 days of receiving your order. Any return or replacement requests made after this 
              2-day window will not be accepted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Return Eligibility</h2>
            <p>
              To be eligible for a return, your item must be:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>In the exact condition that you received it</li>
              <li>Unworn and unused</li>
              <li>In the original packaging with all tags attached</li>
              <li>Accompanied by the original receipt or proof of purchase</li>
            </ul>
            <p>
              The following items cannot be returned:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Custom-made or personalized jewelry</li>
              <li>Items marked as "Final Sale" or "Non-Returnable"</li>
              <li>Items that have been worn, damaged, or altered</li>
              <li>Sale items or items purchased with discounts over 30%</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Replacement Process</h2>
            <p>
              If you've received a defective or damaged item, or if we shipped the wrong item, 
              you may request a replacement within 2 days of delivery.
            </p>
            <p>
              To request a replacement:
            </p>
            <ol className="list-decimal pl-8 my-4">
              <li>Contact our customer service team at starajewels@gmail.com or +91 80869 25925 within 2 days of delivery</li>
              <li>Include your order number, photos of the item, and a description of the issue</li>
              <li>Our team will review your request and issue return authorization if approved</li>
              <li>Return the item using the provided return label</li>
              <li>Once we receive and verify the returned item, we will ship a replacement</li>
            </ol>
            <p>
              Replacement shipping is free of charge for defective items or shipping errors. 
              For size exchanges or other non-defect issues, standard shipping rates will apply 
              unless otherwise specified.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Return Process</h2>
            <p>
              To initiate a return:
            </p>
            <ol className="list-decimal pl-8 my-4">
              <li>Contact our customer service team at starajewels@gmail.com or +91 80869 25925 within 2 days of delivery</li>
              <li>Include your order number and reason for return</li>
              <li>Our team will review your request and issue return authorization if approved</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Include the return authorization number and original receipt</li>
              <li>Ship the item to the address provided in the return authorization</li>
            </ol>
            <p>
              Return shipping costs are the responsibility of the customer unless the return is due to 
              our error (wrong item shipped or defective product). We recommend using a trackable shipping 
              service to ensure the safe return of your item.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Exchanges</h2>
            <p>
              We do not process direct exchanges. If you wish to exchange an item, you will need to 
              return the original purchase and place a new order for the desired item.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Warranty Claims</h2>
            <p>
              For warranty claims on manufacturing defects, please refer to our separate Warranty Policy. 
              Warranty claims follow a different process and timeframe than returns or replacements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have any questions about our Return & Replacement Policy, please contact us at:
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

export default ReturnReplacementPolicy;