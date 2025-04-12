import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        {/* Main footer content with three columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Subscribe column */}
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

          {/* Help column */}
          <div>
            <h3 className="font-normal text-xl mb-4">Help</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">FAQ&apos;s</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Shipping & Handling</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Return & Exchange</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Warranty Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Refund Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Request for Return / Exchange</a></li>
            </ul>
          </div>

          <div>
              <h3 className="font-normal text-xl mb-4">All About Benefits</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Lifetime Buy-Back Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Lifetime Warranty Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-normal text-xl mb-4">About Us</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Blogs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-black text-[14px]">Stores & Services</a></li>
              </ul>
            </div>

       
        </div>

        {/* Social media and copyright section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-center space-x-4 mb-6">
            <a href="#" className="text-gray-400 hover:text-black text-[14px] rounded-full border border-gray-300 p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-black text-[14px] rounded-full border border-gray-300 p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-black text-[14px] rounded-full border border-gray-300 p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-black text-[14px] rounded-full border border-gray-300 p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-black text-[14px] rounded-full border border-gray-300 p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          {/* Payment options */}
          {/* <div className="flex justify-center space-x-4 mb-6">
            <img src="https://cdn.stara.com/media/google-pay_1.svg" alt="Google Pay" className="h-8" />
            <img src="https://cdn.stara.com/media/mastercard.svg" alt="Mastercard" className="h-8" />
            <img src="https://cdn.stara.com/media/paypal.svg" alt="PayPal" className="h-8" />
            <img src="https://cdn.stara.com/media/visa.svg" alt="Visa" className="h-8" />
          </div> */}

          {/* App download section
          <div className="text-center mb-6">
            <h3 className="font-normal text-xl mb-4">Download the stara App</h3>
            <div className="flex justify-center space-x-4">
              <a href="#" className="inline-block">
                <img src="https://cdn.stara.com/media/google-play.png" alt="Get it on Google Play" className="h-12" />
              </a>
              <a href="#" className="inline-block">
                <img src="https://cdn.stara.com/media/app-store.png" alt="Download on the App Store" className="h-12" />
              </a>
            </div>
          </div> */}

          {/* Popular searches section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
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

          </div>

          {/* Copyright */}
          <div className="text-center text-gray-500 text-sm mt-6">
            <p>All Rights Reserved © Stara</p>
          </div>
        </div>
      </div>
    </footer>
  );
}