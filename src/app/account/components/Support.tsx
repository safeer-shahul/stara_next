'use client';

import { useState } from 'react';
import { Mail, Phone, Clock, Send } from 'lucide-react';

export default function Support() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would submit to your API
      // Here we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success
      setSuccess(true);
      setSubject('');
      setMessage('');
      
    } catch (err) {
      // Handle error
      console.log(err)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-[16px] font-semibold mb-6">Customer Support</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            
            <div className="flex items-start">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <Mail size={18} className="text-gray-600" />
              </div>
              <div className='text-[14px]'>
                <p className="font-medium">Email</p>
                <p className="text-[14px] text-gray-500">starajewels@gmail.com</p>
                <p className="text-[14px] text-gray-500">We respond within 24 hours</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <Phone size={18} className="text-gray-600" />
              </div>
              <div className='text-[14px]'>
                <p className="font-medium">Phone</p>
                <p className="text-[14px] text-gray-500">+91 80869 25925</p>
                <p className="text-[14px] text-gray-500">Mon-Sun, 9am-9pm IST</p>
              </div>
            </div>
            
            {/* <div className="flex items-start">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <MessageSquare size={18} className="text-gray-600" />
              </div>
              <div className='text-[14px]'>
                <p className="font-medium">Live Chat</p>
                <p className="text-[14px] text-gray-500">Available on our website</p>
                <button className="text-[14px] text-[var(--color-primary-950)] font-medium mt-1 flex items-center hover:underline">
                  Start chat <ExternalLink size={14} className="ml-1" />
                </button>
              </div>
            </div>
             */}
            <div className="flex items-start">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <Clock size={18} className="text-gray-600" />
              </div>
              <div className='text-[14px]'>
                <p className="font-medium">Response Time</p>
                <p className="text-[14px] text-gray-500">We aim to respond to all inquiries within 24 hours during business days.</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-[14px] mb-4">Send us a message</h3>
            
            {success ? (
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                <h4 className="font-medium text-green-800 mb-2">Message Sent!</h4>
                <p className="text-green-700 text-[14px]">We&#39;ve received your message and will get back to you shortly.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-3 text-[14px] font-medium text-green-700 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-[14px] font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#175e7a] focus:border-[var(--color-primary-950)] outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-[14px] font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#175e7a] focus:border-[var(--color-primary-950)] outline-none"
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[var(--color-primary-950)] text-[14px] text-white py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Sending...' : (
                    <>
                      Send Message <Send size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}