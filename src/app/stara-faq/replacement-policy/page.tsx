import React from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Replacement Policy | Stara Jewels',
  description: 'Replacement Policy for Stara Jewels',
};

const ReplacementPolicy: NextPage = () => {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Replacement Policy</h1>
          <p className="text-gray-600">Last Updated: July 10, 2025</p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Important Notice</h2>
            <p className="font-bold text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              Please note: Stara Jewels does not offer returns or refunds. We only provide replacements 
              for eligible items under the conditions outlined below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Replacement Period</h2>
            <p className="font-bold text-red-600">
              Stara Jewels accepts replacement requests within 3 days after delivery.
            </p>
            <p>
              To be eligible for a replacement, you must request it within 3 days of receiving your order. 
              Any replacement requests made after this 3-day window will not be accepted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Replacement Eligibility</h2>
            <p>
              To be eligible for a replacement, your item must be:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>In the exact condition that you received it</li>
              <li>Unworn and unused</li>
              <li>In the original packaging with all tags attached</li>
              <li>Accompanied by the original receipt or proof of purchase</li>
            </ul>
            {/* <p>
              The following items cannot be replaced:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Custom-made or personalized jewelry</li>
              <li>Items marked as "Final Sale" or "Non-Replaceable"</li>
              <li>Items that have been worn, damaged, or altered by customer use</li>
              <li>Sale items or items purchased with discounts over 30%</li>
            </ul> */}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Replacement Limitations</h2>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="font-semibold text-yellow-800">
                Important: You can only request replacement once per order (not per item).
              </p>
            </div>
            <p>
              All replacement requests are subject to admin approval. Please ensure your request 
              meets all eligibility criteria before submitting.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Replacement Process</h2>
            <p>
              You can request a replacement directly through your order page or by contacting our admin team.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">For Damaged Items:</h3>
            <ol className="list-decimal pl-8 my-4">
              <li>Navigate to your order page within 3 days of delivery</li>
              <li>Select the replacement option for the damaged item</li>
              <li>Upload at least one clear image showing the damage</li>
              <li>Provide a detailed description of the damage</li>
              <li>Submit your replacement request for admin approval</li>
              <li>Wait for admin approval (processing may take 7-10 business days)</li>
              <li>Once approved, return the original item in its original packaging</li>
              <li>Replacement item will be shipped after we receive your original items</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3 mt-6">For Size Changes:</h3>
            <ol className="list-decimal pl-8 my-4">
              <li>Navigate to your order page within 3 days of delivery</li>
              <li>Select the replacement option for size change</li>
              <li>Choose a different size (you cannot select the same size as your current order)</li>
              <li>Provide reason for size change</li>
              <li>Submit your replacement request for admin approval</li>
              <li>Wait for admin approval (processing may take 7-10 business days)</li>
              <li>Once approved, return the original item in its original packaging</li>
              <li>Replacement item will be shipped after we receive your original items</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3 mt-6">Contact Admin Team:</h3>
            <p>
              Alternatively, you can contact our admin team directly at:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Email: starajewels@gmail.com</li>
              <li>Phone: +91 80869 25925</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Replacement Details</h2>
            <ul className="list-disc pl-8 my-4">
              <li><strong>Shipping:</strong> Replacement item shipping is completely free of charge</li>
              <li><strong>Processing Time:</strong> 7-10 business days after admin approval and receiving your original items</li>
              <li><strong>Product Match:</strong> Replacement items will be of the quantity as your original order</li>
              <li><strong>Packaging:</strong> Original items must be returned in their original packaging with all tags</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping Instructions</h2>
            <p>
              Once your replacement request is approved, we will provide you with specific shipping 
              instructions and a return label if applicable. Please ensure:
            </p>
            <ul className="list-disc pl-8 my-4">
              <li>Items are securely packed in original packaging</li>
              <li>All tags are included</li>
              <li>Original receipt or proof of purchase is included</li>
              <li>Items are shipped using a trackable service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Warranty Claims</h2>
            <p>
              For warranty claims on manufacturing defects, please refer to our separate Warranty Policy. 
              Warranty claims follow a different process and timeframe than replacements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have any questions about our Replacement Policy or need assistance with your replacement request, 
              please contact our admin team at:
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

export default ReplacementPolicy;