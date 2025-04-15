import React from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Stara Jewels',
  description: 'Refund Policy for Stara Jewels',
};
const RefundPolicy: NextPage = () => {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Refund Policy</h1>
          <p className="text-gray-600">Last Updated: April 15, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Refund Eligibility</h2>
            <p className="font-bold text-red-600">
              Refund requests must be made within 2 days of delivery and are subject to our Return Policy conditions.
            </p>
            <p>
              To be eligible for a refund, your item must be unworn, unused, in its original condition, 
              and in the original packaging with all tags attached. You must contact our customer service 
              team within 2 days of receiving your order to request a refund.
            </p>
            <p>
              The following items are not eligible for refunds:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Custom-made or personalized jewelry</li>
              <li>Items marked as &quot;Final Sale&quot; or &quot;Non-Refundable&quot;</li>
              <li>Items that have been worn, damaged, or altered</li>
              <li>Sale items or items purchased with discounts over 30%</li>
              <li>Gift cards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
            <p>
              To initiate a refund:
            </p>
            <ol className="list-decimal pl-8 my-4">
              <li>Contact our customer service team at starajewels@gmail.com or +91 80869 25925 within 2 days of delivery</li>
              <li>Include your order number and reason for the refund request</li>
              <li>Our team will review your request and issue return authorization if approved</li>
              <li>Return the item following the instructions in our Return Policy</li>
              <li>Once we receive and inspect the returned item, we will process your refund</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Refund Methods and Timeframes</h2>
            <p>
              Refunds will be issued to the original payment method used for the purchase:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Credit/Debit Cards:</strong> 5-10 business days after refund is processed</li>
              <li><strong>UPI:</strong> 3-5 business days after refund is processed</li>
              <li><strong>Net Banking:</strong> 3-7 business days after refund is processed</li>
              <li><strong>Store Credit:</strong> Immediately after refund is processed</li>
            </ul>
            <p>
              Please note that your bank or credit card company may have additional processing times 
              that are beyond our control. This may delay the visibility of the refund in your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Full and Partial Refunds</h2>
            <p>
              <strong>Full refunds</strong> will be issued for:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Items returned in their original condition within the 2-day window</li>
              <li>Canceled orders that have not yet shipped</li>
              <li>Defective items (subject to verification)</li>
              <li>Incorrect items shipped by our team</li>
            </ul>
            <p>
              <strong>Partial refunds</strong> may be issued for:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Items returned with missing parts or packaging</li>
              <li>Items showing signs of minimal handling</li>
              <li>Late return requests (evaluated on a case-by-case basis)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping Costs and Refunds</h2>
            <p>
              Original shipping charges are non-refundable except in cases where:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>We shipped the wrong item</li>
              <li>The item arrived damaged or defective</li>
              <li>The order qualifies for free shipping</li>
            </ul>
            <p>
              Return shipping costs are the responsibility of the customer unless the return is due to 
              our error (wrong item shipped or defective product).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Store Credit Option</h2>
            <p>
              In cases where a direct refund cannot be processed, or at the customer&apos;s request, we offer 
              the option of store credit:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Store credit is issued at the full purchase value in Indian Rupees (₹)</li>
              <li>Store credit is valid for 12 months from the date of issue</li>
              <li>Store credit can be applied to any future purchase on our website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have any questions about our Refund Policy, please contact us at:
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

export default RefundPolicy;