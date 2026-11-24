const CONTACT_EMAIL = 'yssmi@naver.com';
const CONTACT_TEL = '010-3268-0088';

export default function ContactFooter() {
  return (
    <footer
      id="contact"
      aria-label="Contact Footer"
      className="fixed inset-x-0 bottom-0 z-[5] w-full h-[88dvh] bg-[linear-gradient(180deg,#080B10_0%,#0C121B_28%,#101723_72%,#17111A_100%)] text-[#D7D0C3] overflow-hidden flex flex-col justify-between"
    >
      {/* Brand Navy & Crimson Atmospheric Gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_78%_58%_at_50%_104%,rgba(165,42,67,0.24)_0%,rgba(165,42,67,0.06)_46%,transparent_78%),radial-gradient(circle_at_18%_40%,rgba(215,208,195,0.04)_0%,transparent_52%)]"
      />

      <div className="relative z-10 w-full h-full px-6 sm:px-10 md:px-14 lg:px-16 pt-24 sm:pt-28 pb-24 sm:pb-12 flex flex-col justify-between gap-10">
        {/* Section Heading Matching Other Sections (No Hanja) */}
        <div className="w-full text-center">
          <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.65rem)] font-bold tracking-[-0.03em] leading-none text-[#EAE5DC]">
            contact<span className="text-[#A52A43]">.</span>
          </h2>
        </div>

        {/* Contact Typographic Centerpiece */}
        <div className="my-auto w-full flex flex-col items-start">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-display text-2xl sm:text-4xl md:text-[2.75rem] lg:text-[3.15rem] font-medium tracking-[-0.025em] text-[#D7D0C3] hover:text-[#EAE5DC] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A52A43]"
          >
            {CONTACT_EMAIL}
          </a>

          <a
            href={`tel:${CONTACT_TEL}`}
            aria-label="전화번호 010-3268-0088"
            className="mt-5 sm:mt-7 block text-[7.1vw] sm:text-[6.8vw] md:text-[6.3vw] lg:text-[6.4vw] font-bold tracking-[-0.035em] leading-[1.08] whitespace-nowrap text-[#EAE5DC] hover:text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#A52A43]"
          >
            공일공<span className="text-[#A52A43]">.</span>삼이육팔
            <span className="text-[#A52A43]">.</span>공공팔팔
          </a>
        </div>

        {/* Bottom Copyright & Crimson Accent Credit */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:pr-20 text-xs sm:text-[13px]">
          <p className="font-display tracking-[0.06em] text-[#9E988C]">
            © 2026. moodang-teacher.com
          </p>
          <p className="font-semibold tracking-[0.02em] text-[#A52A43]">
            Google AI Studio와 막걸리로 만들었습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
