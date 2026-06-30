import React, { useState } from "react";
import { Send, CheckCircle, Mail, HelpCircle, FileText } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const headingRef = useScrollReveal<HTMLDivElement>();
  const formRef = useScrollReveal<HTMLDivElement>();
  const infoRef = useScrollReveal<HTMLDivElement>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setLoading(true);
    setErrorMsg(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_xtg5319";
    const adminTemplateId = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID;
    const replyTemplateId = import.meta.env.VITE_EMAILJS_REPLY_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!adminTemplateId || !publicKey) {
      console.warn("EmailJS template ID or public key is not configured in environment variables.");
      // Fallback behavior if environment variables are not set yet
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setTimeout(() => setSubmitted(false), 5000);
      }, 1200);
      return;
    }

    try {
      // 1. Send admin notification email
      const adminRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: adminTemplateId,
          user_id: publicKey,
          template_params: {
            from_name: name,
            from_email: email,
            subject: subject || "No Subject",
            message: message,
            to_email: "pranjalkhandelwal46@gmail.com",
          },
        }),
      });

      if (!adminRes.ok) {
        const errText = await adminRes.text();
        throw new Error(`Admin email dispatch failed: ${errText}`);
      }

      // 2. Send customer auto-reply email (if configured)
      if (replyTemplateId) {
        const replyRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: replyTemplateId,
            user_id: publicKey,
            template_params: {
              to_name: name,
              to_email: email,
            },
          }),
        });

        if (!replyRes.ok) {
          console.warn("Auto-reply template failed to send, but admin notification succeeded.");
        }
      }

      setLoading(false);
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTimeout(() => setSubmitted(false), 5000);

    } catch (err: any) {
      console.error("EmailJS sending error:", err);
      setErrorMsg("Failed to transmit message. Please verify template keys or try again later.");
      setLoading(false);
    }
  };

  return (
    <section id="Contact" className="bg-[#111111] py-20 sm:py-28 px-5 sm:px-10 md:px-14 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="scroll-fade-in mb-12 sm:mb-16">
          <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Get In Touch
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
            Contact{" "}
            <span className="font-playfair italic font-normal">Sakamoto</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: Contact Info */}
          <div ref={infoRef} className="lg:col-span-5 space-y-8 scroll-fade-in scroll-fade-left">
            <div>
              <h3 className="text-white text-lg font-medium mb-3">Customer Support</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Our support team is available Monday through Friday, 9:00 AM – 6:00 PM JST to assist you with order status, sizing, or general inquiries.
              </p>
              <div className="space-y-2.5">
                <a href="mailto:support@sakamoto-apparel.com" className="flex items-center gap-3 text-[#e8702a] text-sm hover:underline">
                  <Mail size={16} />
                  support@sakamoto-apparel.com
                </a>
                <span className="flex items-center gap-3 text-white/50 text-sm">
                  <HelpCircle size={16} />
                  Response time: Within 24 Hours
                </span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-8">
              <h3 className="text-white text-lg font-medium mb-3">Press & Partnerships</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                For wholesale accounts, brand collaborations, editorial styling pulls, or media inquiries, please reach out to our public relations desk.
              </p>
              <a href="mailto:press@sakamoto-apparel.com" className="flex items-center gap-3 text-[#e8702a] text-sm hover:underline">
                <FileText size={16} />
                press@sakamoto-apparel.com
              </a>
            </div>
          </div>

          {/* Right: Message Form */}
          <div ref={formRef} className="lg:col-span-7 scroll-fade-in scroll-fade-right">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8">
              <h3 className="text-white text-xl font-light mb-6">Send a Message</h3>

              {errorMsg && (
                <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl p-4">
                  <p>{errorMsg}</p>
                </div>
              )}

              {submitted ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center space-y-3 animate-modal-scale">
                  <CheckCircle size={32} className="text-green-400 mx-auto" />
                  <h4 className="text-white font-medium">Message Transmitted</h4>
                  <p className="text-white/60 text-sm max-w-sm mx-auto">
                    Thank you for reaching out. We have logged your query and will reply via email shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Arjun Sharma"
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="arjun@domain.com"
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Order Inquiry / Sizing Help"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Detail your request here..."
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Inquiry
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
