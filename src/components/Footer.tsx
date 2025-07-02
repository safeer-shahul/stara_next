import { Mail, MapPin, Phone, Facebook, Instagram, Linkedin } from "lucide-react";
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-normal text-xl mb-4">Subscribe to receive exciting gifts!</h3>
            <div className="flex mb-6">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow p-2 border border-gray-300 focus:outline-none text-[14px]"
              />
              <button className="text-black px-3 py-2 -ml-15">
                <Mail size={30}/>
              </button>
            </div>

            <div className="text-gray-400 space-y-3">
              <p className="flex items-center text-[14px]">
                <MapPin className="w-5 h-5 mr-2" />
                <span>Third Floor, Nalonkandy Arcade,<br/>
                Pushpa Junction, Calicut, India 673002</span>
              </p>
              <p className="flex items-center text-[14px]">
                <Phone className="w-5 h-5 mr-2" />
                <span>+91 80869 25925</span>
              </p>
              <p className="flex items-center text-[14px]">
                <Mail className="w-5 h-5 mr-2" />
                <span>starajewels@gmail.com</span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-normal text-xl mb-4">Help</h3>
            <ul className="space-y-2">
              <li><a href="/stara-faq/shipping-handling" className="text-gray-400 hover:text-black text-[14px]">Shipping & Handling</a></li>
              <li><a href="/stara-faq/return-replacement-policy" className="text-gray-400 hover:text-black text-[14px]">Return & Replacement Policy</a></li>
              <li><a href="/stara-faq/refund-policy" className="text-gray-400 hover:text-black text-[14px]">Refund Policy</a></li>
              <li><a href="/stara-faq/terms-of-services" className="text-gray-400 hover:text-black text-[14px]">Terms of Service</a></li>
              <li><a href="/stara-faq/privacy-policy" className="text-gray-400 hover:text-black text-[14px]">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-normal text-xl mb-4">About Us</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-center space-x-4 mb-6">
            <a href="#" className="text-gray-400 hover:text-black rounded-full border border-gray-300 p-2">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-black rounded-full border border-gray-300 p-2">
              <Instagram className="w-6 h-6" />
            </a>
            {/* <a href="#" className="text-gray-400 hover:text-black rounded-full border border-gray-300 p-2">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-black rounded-full border border-gray-300 p-2">
              <Youtube className="w-6 h-6" />
            </a> */}
            <a href="#" className="text-gray-400 hover:text-black rounded-full border border-gray-300 p-2">
              <Linkedin className="w-6 h-6" />
            </a>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <div className="h-8 w-24 relative">
              <Image 
                src="/images/Razorpay_logo.svg.png" 
                alt="RazorPay"
                width={96}
                height={32}
                style={{ objectFit: 'contain' }} 
              />
            </div>
            <div className="h-8 w-24 relative">
              <Image 
                src="/images/delhiverylogo.png" 
                alt="Delhivery" 
                width={96}
                height={32}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-normal text-xl mb-4 text-center">Popular Searches</h3>

            <div className="mb-4">
              <h4 className="font-medium mb-2">For Women</h4>
              <p className="text-gray-400">
                <a href="#" className="hover:text-black">Rings For Women</a> | 
                <a href="#" className="hover:text-black"> Earrings For Women</a> | 
                <a href="#" className="hover:text-black"> Bracelet For Women</a> | 
                <a href="#" className="hover:text-black"> Pendants For Women</a> | 
                <a href="#" className="hover:text-black"> Necklaces For Women</a>
              </p>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">For Men</h4>
              <p className="text-gray-400">
                <a href="#" className="hover:text-black">Rings For Men</a> | 
                <a href="#" className="hover:text-black"> Pendant For Men</a> | 
                <a href="#" className="hover:text-black"> Chain For Men</a>
              </p>
            </div>

          </div> */}

          <div className="text-center text-gray-500 text-sm mt-6">
            <p>All Rights Reserved © Stara</p>
          </div>
        </div>
      </div>
    </footer>
  );
}