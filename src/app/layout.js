import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PaperPulse | Learn Trading Without Risking Real Money",
  description: "Master the markets with zero risk. Practice paper trading crypto, forex, and stocks using virtual money. Real-time prices, analytical portfolios, and global tournaments.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-[#111111]">{children}</body>
    </html>
  );
}
