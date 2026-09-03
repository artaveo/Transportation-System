export type Lang = "fa" | "en"

/**
 * Fraunces (serif) only covers Latin, so it renders Persian as tofu boxes.
 * Use the serif display face for English and Vazirmatn (sans) for Farsi.
 */
export const displayFont = (lang: Lang) => (lang === "en" ? "font-serif" : "font-sans")

export const dictionary = {
  fa: {
    dir: "rtl" as const,
    brand: "سفرِ شب‌رو",
    nav: {
      routes: "مسیرها و قیمت‌ها",
      about: "دربارهٔ ما",
      faq: "سوالات متداول",
      contact: "تماس با ما",
    },
    langButton: "English",
    login: "ورود",
    hero: {
      kicker: "حمل و نقل بین‌شهری افغانستان",
      title: "سفری آرام از دلِ کوه‌ها، از شهری به شهر دیگر",
      subtitle:
        "بلیت بس‌های بزرگ بین‌شهری را آنلاین و در چند لحظه رزرو کنید. مسیر منظم کابل تا هرات، با توقف در غزنی، قلات، کندهار، هلمند، نیمروز و فراه.",
      origin: "مبدأ",
      originPlaceholder: "شهر مبدأ را انتخاب کنید",
      destination: "مقصد",
      destinationPlaceholder: "شهر مقصد را انتخاب کنید",
      date: "تاریخ سفر",
      passengers: "مسافران",
      passenger: "مسافر",
      search: "جست‌وجوی سفر",
      swap: "جابه‌جایی مبدأ و مقصد",
      helper:
        "برای دیدن نوع بس، شمارهٔ چوکی خالی، ساعت دقیق حرکت و قیمت هر سرویس، لطفاً مبدأ، مقصد و تاریخ سفر خود را مشخص کنید.",
    },
    routes: {
      title: "مسیرهای پرطرفدار",
      subtitle: "پرترددترین خطوط ما در کریدور جنوب‌غربی",
      from: "از",
      to: "به",
      duration: "مدت سفر",
      startingFrom: "شروع از",
      currency: "افغانی",
      hours: "ساعت",
      daily: "روزانه",
      trips: "سرویس",
      view: "مشاهدهٔ زمان‌ها",
    },
    track: {
      title: "پیگیری رزرو",
      subtitle:
        "برای مشاهدهٔ جزئیات رزرو خود، کد رهگیری و شمارهٔ تماسی که هنگام رزرو استفاده کرده‌اید را وارد کنید.",
      refLabel: "کد رهگیری",
      refPlaceholder: "مثال: SB-7K4RXT",
      phoneLabel: "شمارهٔ تماس",
      phonePlaceholder: "07xxxxxxxx",
      submit: "جست‌وجوی رزرو",
      resultTitle: "رزرو شما یافت شد",
      notFoundTitle: "رزروی با این مشخصات یافت نشد",
      notFoundBody:
        "لطفاً کد رهگیری و شمارهٔ تماس را دوباره بررسی کنید، یا با نزدیک‌ترین دفتر تماس بگیرید.",
      contactOffices: "مشاهدهٔ دفاتر",
      editContact: "ویرایش اطلاعات تماس",
      requestCancel: "درخواست کنسلی",
      editContactTitle: "ویرایش اطلاعات تماس رزرو",
      newPhoneLabel: "شمارهٔ تماس جدید",
      saveChanges: "ثبت تغییر",
      contactUpdated: "شمارهٔ تماس شما به‌روزرسانی شد. تأییدیهٔ نهایی از طریق پیامک ارسال می‌شود.",
      cancelConfirmTitle: "درخواست کنسلی رزرو",
      cancelConfirmBody:
        "درخواست کنسلی شما ثبت شد. طبق سیاست کنسلی و بازپرداخت، وضعیت نهایی از طریق شمارهٔ تماس شما اطلاع داده می‌شود.",
      cancelAction: "بله، درخواست کنسلی ثبت شود",
      cancelDismiss: "انصراف",
      viewCancellationPolicy: "مشاهدهٔ سیاست کنسلی",
    },
    routesPage: {
      kicker: "قیمت‌ها و زمان‌بندی",
      title: "مسیرها و قیمت‌ها",
      subtitle:
        "فهرست کامل مسیرهای فعال ما در کریدور کابل تا هرات، همراه با مدت سفر؛ برای رزرو، مسیر موردنظر را جست‌وجو کنید.",
      filterLabel: "استان مبدأ یا مقصد",
      filterAll: "همهٔ مسیرها",
      colFrom: "از",
      colTo: "به",
      colDuration: "مدت سفر",
      colPrice: "قیمت",
      colDaily: "سرویس روزانه",
      view: "جست‌وجو و رزرو",
      priceNote:
        "[PLACEHOLDER — نیاز به قیمت واقعی از شرکت] قیمت دقیق و تعداد سرویس روزانهٔ هر مسیر هنوز از شرکت تأیید نشده است؛ اعداد این جدول نمونه هستند و پیش از انتشار نهایی باید جایگزین شوند.",
    },
    fleet: {
      title: "ناوگانی که برای فاصله‌های طولانی ساخته شده",
      subtitle: "کوچ‌های مدل «۵۸۰» (Mercedes-Benz Travego/O580)، آمادهٔ سفرهای چندساعته میان‌شهری.",
      items: [
        {
          title: "تهویهٔ مطبوع",
          desc: "دمای مطبوع در گرمای تابستان و سرمای زمستان، در تمام طول مسیر.",
        },
        {
          title: "فضای بار مطمئن",
          desc: "جای کافی برای چمدان و بار خانواده، با نظارت در هر توقف.",
        },
        {
          title: "چوکی‌های راحت",
          desc: "چوکی‌های پهن با فضای پا برای نشستن راحت در مسیرهای طولانی.",
        },
        {
          title: "سفر به‌موقع",
          desc: "حرکت و رسیدن بر اساس جدول زمانی مشخص و قابل اعتماد.",
        },
      ],
    },
    whyUs: {
      kicker: "چرا سفرِ شب‌رو",
      title: "چرا ما را انتخاب کنید",
      subtitle: "دلایلی که مسافران کریدور کابل تا هرات به ما اعتماد می‌کنند.",
      items: [
        {
          title: "رزرو بدون حساب کاربری",
          desc: "فقط با شمارهٔ تماس رزرو کنید و کد رهگیری بگیرید؛ ساخت حساب کاربری اصلاً لازم نیست.",
          placeholder: false,
        },
        {
          title: "بلیت دیجیتال با کد QR",
          desc: "بلیت شما بلافاصله پس از پرداخت صادر می‌شود و همراه کد رهگیری و QR قابل نمایش یا چاپ است.",
          placeholder: false,
        },
        {
          title: "دو سطح خدمات، یک استاندارد آسایش",
          desc: "بسته به بودجه و نیاز سفر، میان چیدمان استاندارد ۲+۲ یا وی‌آی‌پی ۱+۲ یکی را انتخاب کنید.",
          placeholder: false,
        },
        {
          title: "پرداخت آنلاین یا نقدی",
          desc: "پرداخت آنلاین یا پرداخت نقدی در دفتر و هنگام سوار شدن — هرکدام که برایتان راحت‌تر است.",
          placeholder: false,
        },
        {
          title: "پشتیبانی در دفاتر شهری",
          desc: "دفاتر فروش در مسیر کابل تا هرات، برای رزرو حضوری یا هر پرسشی دربارهٔ سفرتان.",
          placeholder: false,
        },
        {
          title: "ردیابی زندهٔ بس",
          desc: "امکان مشاهدهٔ موقعیت بس روی نقشه در طول سفر.",
          placeholder: true,
        },
      ],
      placeholderTag: "نیاز به تأیید مشتری",
    },
    destinationsSection: {
      kicker: "شبکهٔ سفر",
      title: "مقصدهای تحت پوشش",
      subtitle: "کریدور اصلی ما شهرهای زیر را از کابل تا هرات به هم وصل می‌کند.",
      viewSchedule: "مشاهدهٔ زمان‌بندی",
      corridorNote: "همهٔ این شهرها روی یک خط اصلی قرار دارند؛ رزرو میان هر دو نقطه از این مسیر ممکن است.",
    },
    trustStats: {
      title: "سفرِ شب‌رو در یک نگاه",
      subtitle: "این اعداد پس از تأیید نهایی شرکت به‌روزرسانی می‌شوند.",
      items: [
        { label: "سال‌های فعالیت" },
        { label: "شهر تحت پوشش" },
        { label: "سرویس روزانه" },
      ],
      placeholderTag: "PLACEHOLDER",
    },
    footer: {
      tagline: "شبکهٔ حمل و نقل بین‌شهری، از کابل تا هرات.",
      officesTitle: "دفاتر شهری",
      quickTitle: "دسترسی سریع",
      contactTitle: "تماس با ما",
      phone: "شمارهٔ تماس",
      email: "ایمیل",
      rights: "تمامی حقوق محفوظ است.",
      quick: [
        { label: "مسیرها و قیمت‌ها", href: "/routes" },
        { label: "پیگیری بلیت", href: "/track" },
        { label: "سیاست بار و اثاثیه", href: "/luggage-policy" },
        { label: "سوالات متداول", href: "/faq" },
        { label: "شرایط و ضوابط", href: "/terms" },
        { label: "حریم خصوصی", href: "/privacy" },
      ],
      contactPlaceholder: "[PLACEHOLDER — نیاز به شماره و ایمیل واقعی شرکت]",
      officeDetailPlaceholder: "[PLACEHOLDER — نیاز به آدرس و شماره تماس دقیق این دفتر]",
    },
    offices: [
      { cityFa: "کابل", cityEn: "Kabul", nameFa: "دفتر مرکزی", nameEn: "Central office" },
      { cityFa: "کابل", cityEn: "Kabul", nameFa: "دفتر کوته‌سنگی", nameEn: "Kote Sangi office" },
      { cityFa: "کابل", cityEn: "Kabul", nameFa: "دفتر کمپنی", nameEn: "Kampani office" },
      { cityFa: "غزنی", cityEn: "Ghazni", nameFa: "دفتر غزنی", nameEn: "Ghazni office" },
      { cityFa: "قلات", cityEn: "Qalat", nameFa: "دفتر قلات", nameEn: "Qalat office" },
      { cityFa: "کندهار", cityEn: "Kandahar", nameFa: "دفتر اصلی", nameEn: "Main office" },
      { cityFa: "کندهار", cityEn: "Kandahar", nameFa: "دفتر باغ پل", nameEn: "Bagh-e Pol office" },
      { cityFa: "هلمند", cityEn: "Helmand", nameFa: "دفتر هلمند", nameEn: "Helmand office" },
      { cityFa: "نیمروز", cityEn: "Nimroz", nameFa: "دفتر نیمروز", nameEn: "Nimroz office" },
      { cityFa: "فراه", cityEn: "Farah", nameFa: "دفتر فراه", nameEn: "Farah office" },
      { cityFa: "هرات", cityEn: "Herat", nameFa: "دفتر هرات", nameEn: "Herat office" },
    ],
    common: {
      back: "بازگشت",
      continue: "ادامه",
      currency: "افغانی",
      total: "مجموع",
      seat: "چوکی",
      seats: "چوکی",
      passenger: "مسافر",
      passengers: "مسافر",
      to: "به",
      night: "شبانه",
      day: "روزانه",
      close: "بستن",
      optional: "اختیاری",
      placeholder: "PLACEHOLDER",
    },
    search: {
      resultsTitle: "سرویس‌های موجود",
      resultsSub: "سرویس برای این مسیر یافت شد",
      editSearch: "ویرایش جست‌وجو",
      departure: "حرکت",
      arrival: "رسیدن",
      duration: "مدت",
      seatsLeft: "چوکی خالی",
      full: "تکمیل",
      selectSeats: "انتخاب چوکی",
      sortTitle: "مرتب‌سازی",
      sortEarliest: "زودترین حرکت",
      sortCheapest: "ارزان‌ترین",
      sortFastest: "سریع‌ترین",
      filtersTitle: "پالایش",
      timeOfDay: "زمان حرکت",
      morning: "صبح",
      afternoon: "بعد از ظهر",
      evening: "شب",
      amenities: "امکانات",
      busType: "نوع بس",
      priceRange: "بازهٔ قیمت",
      upTo: "تا",
      noResults: "برای این مسیر سرویسی یافت نشد.",
      hours: "ساعت",
      flexibleDeparture: "بر اساس تکمیل ظرفیت",
    },
    amenities: {
      ac: "تهویهٔ مطبوع",
      wifi: "اینترنت",
      charging: "شارژر",
      refreshment: "پذیرایی",
      reclining: "چوکی تختخواب‌شو",
    },
    busTypes: {
      vip: "وی‌آی‌پی ۱+۲",
      standard: "استاندارد ۲+۲",
    },
    seats: {
      title: "انتخاب چوکی",
      coach: "بس",
      driver: "راننده",
      door: "درب",
      legendAvailable: "خالی",
      legendBooked: "رزروشده",
      legendSelected: "انتخاب‌شده",
      selectedTitle: "چوکی‌های انتخاب‌شده",
      none: "هنوز چوکی‌ای انتخاب نشده است.",
      max: "حداکثر تعداد چوکی انتخاب شد.",
      pricePerSeat: "قیمت هر چوکی",
      continueToCheckout: "ادامه به پرداخت",
      seatLabel: "چوکی شماره",
      statusAvailable: "خالی",
      statusBooked: "رزروشده",
      statusSelected: "انتخاب‌شده",
      layoutNote: "چیدمان این سرویس",
    },
    checkout: {
      title: "تکمیل رزرو",
      passengerDetails: "مشخصات مسافران",
      passengerNo: "مسافر",
      fullName: "نام کامل",
      fullNamePh: "نام و تخلص",
      nationalId: "شمارهٔ تذکره",
      nationalIdPh: "شمارهٔ تذکرهٔ برقی",
      gender: "جنسیت",
      male: "مرد",
      female: "زن",
      contactTitle: "اطلاعات تماس",
      phone: "شمارهٔ تماس",
      email: "ایمیل (اختیاری)",
      luggageTitle: "بار اضافه (اختیاری)",
      luggageOption: "می‌خواهم بار اضافه ثبت کنم",
      luggageNote:
        "[PLACEHOLDER — نیاز به تعرفهٔ واقعی از شرکت] هزینهٔ دقیق بار اضافه هنوز تأیید نشده؛ در صورت انتخاب این گزینه، هماهنگی نهایی هنگام سوار شدن انجام می‌شود.",
      paymentTitle: "شیوهٔ پرداخت",
      payCard: "کارت بانکی (آنلاین)",
      payCardDesc: "پرداخت آنلاین امن با کارت بانکی از طریق درگاه HesabPay.",
      payMobile: "پول موبایلی (آنلاین)",
      payMobileDesc: "پرداخت آنلاین از طریق کیف پول موبایلی شما، از همان درگاه HesabPay.",
      payOffice: "پرداخت آفلاین",
      payOfficeDesc: "پرداخت نقدی در دفتر شرکت یا هنگام سوار شدن؛ رزرو تا زمان پرداخت «در انتظار تأیید» می‌ماند.",
      summaryTitle: "خلاصهٔ سفر",
      route: "مسیر",
      date: "تاریخ",
      seatsLabel: "چوکی‌ها",
      subtotal: "جمع بلیت‌ها",
      serviceFee: "کارمزد خدمات",
      grandTotal: "مبلغ قابل پرداخت",
      pay: "پرداخت و صدور بلیت",
      required: "تکمیل این فیلد الزامی است",
      termsLabel: "شرایط و ضوابط رزرو و همچنین سیاست حریم خصوصی را می‌پذیرم.",
      termsLink: "مشاهدهٔ شرایط و ضوابط",
      privacyLink: "حریم خصوصی",
      termsRequired: "برای ادامه باید شرایط و ضوابط را بپذیرید",
    },
    confirm: {
      title: "بلیت شما صادر شد",
      subtitle: "سفر خوشی برایتان آرزومندیم. جزئیات بلیت به شمارهٔ تماس شما ارسال شد.",
      ref: "کد رهگیری",
      route: "مسیر",
      date: "تاریخ سفر",
      departure: "ساعت حرکت",
      seats: "چوکی‌ها",
      passenger: "مسافر",
      amount: "مبلغ پرداخت‌شده",
      boarding: "لطفاً ۳۰ دقیقه پیش از حرکت در ترمینال حاضر باشید و کد رهگیری را همراه داشته باشید.",
      download: "دریافت بلیت",
      addToCalendar: "افزودن به تقویم",
      home: "بازگشت به صفحهٔ اصلی",
      qrHint: "این کد QR را هنگام سوار شدن نشان دهید",
      supportTitle: "تماس اضطراری با پشتیبانی سفر",
      supportNote:
        "[PLACEHOLDER — نیاز به شمارهٔ پشتیبانی واقعی شرکت] در صورت هرگونه مشکل پیش از یا حین سفر، از طریق صفحهٔ تماس با ما یا نزدیک‌ترین دفتر با ما در ارتباط باشید.",
      contactOffices: "مشاهدهٔ دفاتر پشتیبانی",
    },
    about: {
      kicker: "دربارهٔ ما",
      title: "شبکه‌ای که کابل را به هرات وصل می‌کند",
      intro:
        "«سفرِ شب‌رو» مسافران را در کریدور جنوب‌غربی افغانستان — از کابل تا هرات، با توقف در غزنی، قلات، کندهار، هلمند، نیمروز و فراه — جابه‌جا می‌کند؛ با ناوگانی از کوچ‌های بزرگ بین‌شهری و برنامهٔ حرکت منظم.",
      stats: [
        { label: "سال سابقهٔ فعالیت" },
        { label: "شهر تحت پوشش" },
        { label: "بس در ناوگان" },
        { label: "سرویس روزانه" },
      ],
      statsPlaceholderNote: "[PLACEHOLDER] این آمار پس از دریافت اعداد واقعی از شرکت تکمیل می‌شود.",
      storyTitle: "داستان ما",
      storyBody:
        "شبکهٔ ما یک کریدور واحد را پوشش می‌دهد: کابل، غزنی، قلات، کندهار، هلمند، نیمروز، فراه و هرات. مسافران می‌توانند میان هر دو نقطه از این مسیر رزرو کنند.",
      safetyTitle: "تعهد به ایمنی و کیفیت",
      safetyBody:
        "هر سفر با بس‌های مدل «۵۸۰» (Mercedes-Benz Travego/O580) انجام می‌شود که برای سفرهای طولانی بین‌شهری ساخته شده‌اند. بازرسی فنی پیش از حرکت و رعایت برنامهٔ زمانی از اولویت‌های ماست.",
      fleetPhotoNote: "[PLACEHOLDER — نیاز به تصویر واقعی از دفاتر و بس‌های شرکت]",
      busTypesTitle: "دو سطح خدمات، یک استاندارد آسایش",
      busTypesIntro: "بسته به مسیر و بودجهٔ سفر، می‌توانید بین دو سطح خدمات یکی را انتخاب کنید.",
      vipDesc:
        "چیدمان ۱+۲ با فاصلهٔ بیشتر میان چوکی‌ها و ظرفیت کمتر نسبت به سرویس معمولی، تهویهٔ مطبوع، اینترنت، شارژر، و پذیرایی در طول مسیر.",
      standardDesc:
        "چیدمان ۲+۲ با چوکی‌های راحت و تهویهٔ مطبوع؛ گزینه‌ای مقرون‌به‌صرفه برای سفرهای روزمره.",
      ctaTitle: "آمادهٔ سفر بعدی هستید؟",
      ctaButton: "جست‌وجوی سفر",
    },
    contact: {
      kicker: "تماس با ما",
      title: "با ما در تماس باشید",
      subtitle:
        "برای رزرو حضوری، پیگیری بلیت، یا هر پرسش دیگر، به نزدیک‌ترین دفتر ما مراجعه کنید یا برایمان پیام بگذارید.",
      officesTitle: "دفاتر فروش",
      hours: "هر روز، ۶ صبح تا ۱۰ شب",
      hoursNote: "[PLACEHOLDER — ساعت کاری هر دفتر باید جداگانه تأیید شود]",
      mapTitle: "نقشهٔ کریدور",
      mapNote: "این نقشه، ترتیب جغرافیایی شهرهای تحت پوشش را نشان می‌دهد؛ نقشهٔ دقیق دفاتر پس از دریافت آدرس‌ها اضافه می‌شود.",
      formTitle: "ارسال پیام",
      formName: "نام شما",
      formNamePh: "نام و تخلص",
      formPhone: "شمارهٔ تماس",
      formMessage: "پیام",
      formMessagePh: "پرسش یا درخواست خود را بنویسید…",
      formSubmit: "ارسال پیام",
      required: "تکمیل این فیلد الزامی است",
      sent: "پیام شما ارسال شد. به‌زودی با شما تماس می‌گیریم.",
    },
    faq: {
      kicker: "سوالات متداول",
      title: "پرسش‌های پرتکرار",
      subtitle: "پاسخ سوالات رایج دربارهٔ رزرو، پرداخت، بار همراه، و سیاست کنسلی را اینجا بیابید.",
      groups: [
        {
          title: "رزرو",
          items: [
            {
              q: "آیا برای رزرو نیاز به ساخت حساب کاربری دارم؟",
              a: "خیر. رزرو فقط با شمارهٔ تماس انجام می‌شود و یک کد رهگیری برایتان صادر می‌گردد؛ ساخت حساب کاربری اختیاری است.",
            },
            {
              q: "حداکثر چند چوکی را می‌توانم در یک رزرو انتخاب کنم؟",
              a: "در هر رزرو تا شش چوکی قابل انتخاب است. برای گروه‌های بزرگ‌تر، لطفاً با نزدیک‌ترین دفتر تماس بگیرید.",
            },
            {
              q: "آیا می‌توانم برای شخص دیگری بلیت بخرم؟",
              a: "بله. کافی است در فرم مشخصات مسافران، نام و شمارهٔ تذکرهٔ همان شخص را وارد کنید؛ شمارهٔ تماس رزرو می‌تواند شمارهٔ خودتان باشد.",
            },
          ],
        },
        {
          title: "پرداخت",
          items: [
            {
              q: "چه روش‌های پرداختی پشتیبانی می‌شود؟",
              a: "پرداخت آنلاین با کارت بانکی یا پول موبایلی از طریق درگاه HesabPay، و همچنین پرداخت نقدی در دفتر یا هنگام سوار شدن.",
            },
            {
              q: "اگر پرداخت نقدی انتخاب کنم، بلیت من چه زمانی نهایی می‌شود؟",
              a: "رزروهای پرداخت‌آفلاین با وضعیت «در انتظار تأیید» ثبت می‌شوند و پس از تأیید پرداخت توسط اپراتور، نهایی می‌گردند.",
            },
            {
              q: "آیا پرداخت آنلاین امن است؟",
              a: "پرداخت آنلاین از طریق درگاه HesabPay انجام می‌شود و اطلاعات کارت شما مستقیماً روی سرورهای ما ذخیره نمی‌شود.",
            },
          ],
        },
        {
          title: "کنسلی و بازپرداخت",
          items: [
            {
              q: "آیا می‌توانم رزرو خود را کنسل کنم؟",
              a: "بله. کنسلی تا ۲۴ ساعت پیش از حرکت رایگان است و مبلغ به‌طور کامل بازپرداخت می‌شود. کنسلی کمتر از ۲۴ ساعت مانده به حرکت مشمول ۲۰ درصد کارمزد است.",
            },
            {
              q: "بازپرداخت چقدر زمان می‌برد؟",
              a: "بازپرداخت پرداخت‌های کارتی و موبایلی معمولاً میان سه تا هفت روز کاری انجام می‌شود. پرداخت‌های نقدی در همان دفتری که رزرو شده بازپرداخت می‌گردند.",
            },
            {
              q: "آیا می‌توانم تاریخ سفر را تغییر دهم؟",
              a: "بله، تغییر تاریخ تا ۱۲ ساعت پیش از حرکت و بدون هزینهٔ اضافه، در صورت وجود چوکی خالی در سرویس جدید امکان‌پذیر است.",
            },
          ],
        },
        {
          title: "بار و اثاثیه",
          items: [
            {
              q: "چه مقدار بار همراه مجاز است؟",
              a: "[PLACEHOLDER — نیاز به تأیید مقدار دقیق از شرکت] مقدار دقیق بار مجاز و ابعاد آن هنوز تأیید نشده؛ برای اطلاع دقیق پیش از سفر با دفتر خود تماس بگیرید.",
            },
            {
              q: "اگر بار اضافه داشته باشم چه کنم؟",
              a: "[PLACEHOLDER — نیاز به تعرفهٔ واقعی از شرکت] در فرم رزرو می‌توانید گزینهٔ «بار اضافه» را انتخاب کنید؛ هزینه و شرایط دقیق هنگام سوار شدن با شما هماهنگ می‌شود.",
            },
            {
              q: "چه اقلامی حمل آن‌ها ممنوع است؟",
              a: "مواد قابل‌اشتعال، سلاح و مهمات، و مواد خطرناک یا غیرقانونی مجاز به حمل نیستند. جزئیات کامل در صفحهٔ سیاست بار و اثاثیه آمده است.",
            },
          ],
        },
        {
          title: "در طول سفر",
          items: [
            {
              q: "چقدر زودتر باید در ترمینال حاضر باشم؟",
              a: "لطفاً حداقل ۳۰ دقیقه پیش از ساعت حرکت در ترمینال حاضر باشید و کد رهگیری را همراه داشته باشید.",
            },
            {
              q: "آیا کودکان نیاز به بلیت جداگانه دارند؟",
              a: "کودکان زیر ۲ سال روی آغوش والدین رایگان سفر می‌کنند؛ برای کودکان بالای ۲ سال بلیت کامل صادر می‌شود.",
            },
            {
              q: "آیا در طول مسیر توقف وجود دارد؟",
              a: "بله، بسته به طول مسیر، یک یا چند توقف کوتاه برای استراحت و نماز در نظر گرفته می‌شود.",
            },
          ],
        },
      ],
    },
    luggagePage: {
      kicker: "سیاست سفر",
      title: "سیاست بار و اثاثیه",
      subtitle: "مقدار مجاز بار همراه، بار اضافه، و اقلام ممنوعه پیش از سفر را اینجا بررسی کنید.",
      allowanceTitle: "بار مجاز همراه هر مسافر",
      allowanceBody: "[PLACEHOLDER — نیاز به تأیید مقدار دقیق از شرکت] وزن و ابعاد دقیق بار مجاز (چمدان در انبار بس و بار دستی) هنوز از شرکت دریافت نشده است.",
      extraTitle: "بار اضافه",
      extraBody:
        "[PLACEHOLDER — نیاز به تعرفهٔ واقعی از شرکت] در صورت داشتن بار بیش از حد مجاز، گزینهٔ «بار اضافه» را هنگام رزرو انتخاب کنید. تعرفهٔ دقیق و شرایط پذیرش، هنگام سوار شدن با اپراتور هماهنگ می‌شود.",
      prohibitedTitle: "اقلام ممنوعه",
      prohibitedItems: [
        "مواد قابل‌اشتعال یا منفجره",
        "سلاح، مهمات، و اشیای تیز بدون بسته‌بندی ایمن",
        "مواد شیمیایی خطرناک یا سمی",
        "کالای غیرقانونی طبق قوانین جمهوری اسلامی افغانستان",
      ],
      note: "این سیاست یک چارچوب کلی است و پیش از انتشار نهایی باید با اعداد و شرایط دقیق شرکت تکمیل شود.",
    },
    terms: {
      kicker: "شرایط و ضوابط",
      title: "شرایط و ضوابط استفاده",
      updatedLabel: "آخرین به‌روزرسانی",
      updatedValue: "[PLACEHOLDER]",
      notice:
        "[PLACEHOLDER — این متن یک چارچوب اولیه است و باید پیش از انتشار نهایی توسط تیم حقوقی/مدیریت شرکت بازبینی و تکمیل شود.]",
      sections: [
        {
          heading: "۱. پذیرش شرایط",
          body: "با رزرو بلیت از طریق این وبسایت، شما شرایط و ضوابط زیر را می‌پذیرید.",
        },
        {
          heading: "۲. رزرو و صدور بلیت",
          body: "رزرو با وارد کردن اطلاعات مسافر و شمارهٔ تماس معتبر انجام می‌شود. بلیت دیجیتال پس از تأیید پرداخت صادر می‌گردد.",
        },
        {
          heading: "۳. کنسلی و بازپرداخت",
          body: "سیاست کنسلی و بازپرداخت در صفحهٔ سوالات متداول توضیح داده شده و بخشی از همین شرایط محسوب می‌شود.",
        },
        {
          heading: "۴. مسئولیت بار همراه",
          body: "مسافر مسئول اظهار صحیح بار همراه و رعایت سیاست بار و اثاثیه است.",
        },
        {
          heading: "۵. تغییرات برنامهٔ سفر",
          body: "شرکت در موارد ضروری (شرایط جوی، فنی، یا امنیتی) حق تغییر یا تأخیر برنامهٔ حرکت را برای خود محفوظ می‌دارد.",
        },
      ],
    },
    privacy: {
      kicker: "حریم خصوصی",
      title: "سیاست حریم خصوصی",
      updatedLabel: "آخرین به‌روزرسانی",
      updatedValue: "[PLACEHOLDER]",
      notice:
        "[PLACEHOLDER — این متن یک چارچوب اولیه است و باید پیش از انتشار نهایی توسط تیم حقوقی/مدیریت شرکت بازبینی و تکمیل شود.]",
      sections: [
        {
          heading: "۱. اطلاعاتی که جمع‌آوری می‌کنیم",
          body: "نام مسافر، شمارهٔ تذکره، شمارهٔ تماس، و در صورت وارد کردن، ایمیل — فقط برای صدور و پیگیری بلیت.",
        },
        {
          heading: "۲. استفاده از اطلاعات",
          body: "اطلاعات شما صرفاً برای مدیریت رزرو، اطلاع‌رسانی سفر، و پشتیبانی مشتری استفاده می‌شود.",
        },
        {
          heading: "۳. اشتراک‌گذاری اطلاعات",
          body: "اطلاعات مسافران با اشخاص ثالث به‌جز درگاه پرداخت (برای پردازش تراکنش) و در صورت الزام قانونی، به اشتراک گذاشته نمی‌شود.",
        },
        {
          heading: "۴. نگهداری اطلاعات",
          body: "اطلاعات رزرو تا مدت لازم برای پیگیری و گزارش‌گیری داخلی نگهداری می‌شود.",
        },
      ],
    },
    admin: {
      title: "پنل مدیریت",
      subtitle: "نمای کلی عملیات شبکه",
      nav: {
        dashboard: "داشبورد",
        trips: "سرویس‌ها",
        bookings: "رزروها",
        buses: "ناوگان",
        routes: "مسیرها",
      },
      exit: "خروج از پنل",
      stats: {
        bookings: "رزروهای امروز",
        revenue: "درآمد امروز",
        occupancy: "میانگین اشغال",
        trips: "سرویس‌های فعال",
      },
      vsYesterday: "نسبت به دیروز",
      recentTitle: "رزروهای اخیر",
      recentSub: "آخرین بلیت‌های صادرشده",
      searchPh: "جست‌وجوی کد رهگیری یا نام مسافر…",
      upcomingTitle: "سرویس‌های پیشِ‌رو",
      cols: {
        ref: "کد",
        passenger: "مسافر",
        route: "مسیر",
        date: "تاریخ",
        seats: "چوکی",
        amount: "مبلغ",
        status: "وضعیت",
        time: "حرکت",
        occupancy: "اشغال",
        bus: "بس",
      },
      status: {
        confirmed: "تأییدشده",
        pending: "در انتظار",
        cancelled: "لغوشده",
      },
      allStatuses: "همهٔ وضعیت‌ها",
    },
  },
  en: {
    dir: "ltr" as const,
    brand: "Shabraw",
    nav: {
      routes: "Routes & prices",
      about: "About us",
      faq: "FAQ",
      contact: "Contact us",
    },
    langButton: "دری",
    login: "Sign in",
    hero: {
      kicker: "Intercity transport across Afghanistan",
      title: "A calm journey through the mountains, from one city to the next",
      subtitle:
        "Book seats on large intercity coaches online in moments. A regular corridor from Kabul to Herat, stopping in Ghazni, Qalat, Kandahar, Helmand, Nimroz, and Farah.",
      origin: "From",
      originPlaceholder: "Select departure city",
      destination: "To",
      destinationPlaceholder: "Select destination city",
      date: "Travel date",
      passengers: "Passengers",
      passenger: "passenger",
      search: "Search trips",
      swap: "Swap origin and destination",
      helper:
        "To see bus type, available seat numbers, exact departure time, and price for each trip, please choose your origin, destination, and travel date.",
    },
    routes: {
      title: "Popular routes",
      subtitle: "Our busiest lines along the southwest corridor",
      from: "From",
      to: "To",
      duration: "Duration",
      startingFrom: "From",
      currency: "AFN",
      hours: "h",
      daily: "daily",
      trips: "trips",
      view: "View schedules",
    },
    track: {
      title: "Track your booking",
      subtitle:
        "Enter your booking reference and the phone number you used when booking to view your ticket details.",
      refLabel: "Booking reference",
      refPlaceholder: "e.g. SB-7K4RXT",
      phoneLabel: "Phone number",
      phonePlaceholder: "07xxxxxxxx",
      submit: "Find my booking",
      resultTitle: "Booking found",
      notFoundTitle: "No booking found",
      notFoundBody:
        "Please double-check your booking reference and phone number, or contact your nearest office.",
      contactOffices: "View offices",
      editContact: "Edit contact info",
      requestCancel: "Request cancellation",
      editContactTitle: "Edit booking contact info",
      newPhoneLabel: "New phone number",
      saveChanges: "Save changes",
      contactUpdated: "Your phone number has been updated. Final confirmation is sent by SMS.",
      cancelConfirmTitle: "Cancellation request",
      cancelConfirmBody:
        "Your cancellation request has been submitted. Under our cancellation and refund policy, the final status will be sent to your phone number.",
      cancelAction: "Yes, submit cancellation request",
      cancelDismiss: "Dismiss",
      viewCancellationPolicy: "View cancellation policy",
    },
    routesPage: {
      kicker: "Prices and schedules",
      title: "Routes and prices",
      subtitle:
        "The full list of our active routes along the Kabul-to-Herat corridor, with journey time. Search a route to book.",
      filterLabel: "Origin or destination province",
      filterAll: "All routes",
      colFrom: "From",
      colTo: "To",
      colDuration: "Duration",
      colPrice: "Price",
      colDaily: "Daily trips",
      view: "Search & book",
      priceNote:
        "[PLACEHOLDER — needs real pricing from the company] Exact price and daily trip counts per route are not yet confirmed; the figures in this table are samples and must be replaced before launch.",
    },
    fleet: {
      title: "A fleet built for the long road",
      subtitle: "Model \"580\" coaches (Mercedes-Benz Travego/O580), built for multi-hour intercity journeys.",
      items: [
        {
          title: "Climate control",
          desc: "Comfortable temperatures through summer heat and winter cold, the whole way.",
        },
        {
          title: "Secure luggage space",
          desc: "Room for family baggage, watched over at every stop along the route.",
        },
        {
          title: "Comfortable seats",
          desc: "Wide seats with legroom made for sitting easy on long journeys.",
        },
        {
          title: "On-time travel",
          desc: "Departures and arrivals on a clear, dependable schedule.",
        },
      ],
    },
    whyUs: {
      kicker: "Why Shabraw",
      title: "Why choose us",
      subtitle: "Why travellers on the Kabul-to-Herat corridor trust us.",
      items: [
        {
          title: "No account needed",
          desc: "Book with just a phone number and get a booking reference — no account required.",
          placeholder: false,
        },
        {
          title: "Digital ticket with QR code",
          desc: "Your ticket is issued right after payment, with a reference code and QR you can show or print.",
          placeholder: false,
        },
        {
          title: "Two service levels, one standard of comfort",
          desc: "Choose between our 2+2 standard layout or 1+2 VIP layout, depending on budget and needs.",
          placeholder: false,
        },
        {
          title: "Pay online or in cash",
          desc: "Pay online, or in cash at the office or when boarding — whichever suits you.",
          placeholder: false,
        },
        {
          title: "Support at city offices",
          desc: "Sales offices along the Kabul-to-Herat corridor for in-person booking or any question about your trip.",
          placeholder: false,
        },
        {
          title: "Live bus tracking",
          desc: "See your coach's live location on a map during the journey.",
          placeholder: true,
        },
      ],
      placeholderTag: "Needs client confirmation",
    },
    destinationsSection: {
      kicker: "Our network",
      title: "Destinations we cover",
      subtitle: "Our main corridor connects the following cities from Kabul to Herat.",
      viewSchedule: "View schedule",
      corridorNote: "All of these cities sit along one main line; booking between any two points on this route is possible.",
    },
    trustStats: {
      title: "Shabraw at a glance",
      subtitle: "These figures will be updated once confirmed by the company.",
      items: [
        { label: "Years in operation" },
        { label: "Cities served" },
        { label: "Daily departures" },
      ],
      placeholderTag: "PLACEHOLDER",
    },
    footer: {
      tagline: "An intercity transport network, Kabul to Herat.",
      officesTitle: "City offices",
      quickTitle: "Quick links",
      contactTitle: "Contact",
      phone: "Phone",
      email: "Email",
      rights: "All rights reserved.",
      quick: [
        { label: "Routes & prices", href: "/routes" },
        { label: "Track a ticket", href: "/track" },
        { label: "Luggage policy", href: "/luggage-policy" },
        { label: "FAQ", href: "/faq" },
        { label: "Terms & conditions", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
      ],
      contactPlaceholder: "[PLACEHOLDER — needs the company's real phone number and email]",
      officeDetailPlaceholder: "[PLACEHOLDER — needs this office's exact address and phone number]",
    },
    offices: [
      { cityFa: "کابل", cityEn: "Kabul", nameFa: "دفتر مرکزی", nameEn: "Central office" },
      { cityFa: "کابل", cityEn: "Kabul", nameFa: "دفتر کوته‌سنگی", nameEn: "Kote Sangi office" },
      { cityFa: "کابل", cityEn: "Kabul", nameFa: "دفتر کمپنی", nameEn: "Kampani office" },
      { cityFa: "غزنی", cityEn: "Ghazni", nameFa: "دفتر غزنی", nameEn: "Ghazni office" },
      { cityFa: "قلات", cityEn: "Qalat", nameFa: "دفتر قلات", nameEn: "Qalat office" },
      { cityFa: "کندهار", cityEn: "Kandahar", nameFa: "دفتر اصلی", nameEn: "Main office" },
      { cityFa: "کندهار", cityEn: "Kandahar", nameFa: "دفتر باغ پل", nameEn: "Bagh-e Pol office" },
      { cityFa: "هلمند", cityEn: "Helmand", nameFa: "دفتر هلمند", nameEn: "Helmand office" },
      { cityFa: "نیمروز", cityEn: "Nimroz", nameFa: "دفتر نیمروز", nameEn: "Nimroz office" },
      { cityFa: "فراه", cityEn: "Farah", nameFa: "دفتر فراه", nameEn: "Farah office" },
      { cityFa: "هرات", cityEn: "Herat", nameFa: "دفتر هرات", nameEn: "Herat office" },
    ],
    common: {
      back: "Back",
      continue: "Continue",
      currency: "AFN",
      total: "Total",
      seat: "seat",
      seats: "seats",
      passenger: "passenger",
      passengers: "passengers",
      to: "to",
      night: "overnight",
      day: "daytime",
      close: "Close",
      optional: "optional",
      placeholder: "PLACEHOLDER",
    },
    search: {
      resultsTitle: "Available trips",
      resultsSub: "trips found for this route",
      editSearch: "Edit search",
      departure: "Departure",
      arrival: "Arrival",
      duration: "Duration",
      seatsLeft: "seats left",
      full: "Full",
      selectSeats: "Select seats",
      sortTitle: "Sort by",
      sortEarliest: "Earliest",
      sortCheapest: "Cheapest",
      sortFastest: "Fastest",
      filtersTitle: "Filters",
      timeOfDay: "Departure time",
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      amenities: "Amenities",
      busType: "Bus type",
      priceRange: "Price range",
      upTo: "Up to",
      noResults: "No trips found for this route.",
      hours: "h",
      flexibleDeparture: "Departs when full",
    },
    amenities: {
      ac: "Air conditioning",
      wifi: "Wi-Fi",
      charging: "Charging",
      refreshment: "Refreshments",
      reclining: "Reclining seats",
    },
    busTypes: {
      vip: "VIP 1+2",
      standard: "Standard 2+2",
    },
    seats: {
      title: "Choose your seats",
      coach: "Coach",
      driver: "Driver",
      door: "Door",
      legendAvailable: "Available",
      legendBooked: "Booked",
      legendSelected: "Selected",
      selectedTitle: "Selected seats",
      none: "No seats selected yet.",
      max: "Maximum number of seats selected.",
      pricePerSeat: "Price per seat",
      continueToCheckout: "Continue to checkout",
      seatLabel: "Seat number",
      statusAvailable: "available",
      statusBooked: "booked",
      statusSelected: "selected",
      layoutNote: "This service's layout",
    },
    checkout: {
      title: "Complete your booking",
      passengerDetails: "Passenger details",
      passengerNo: "Passenger",
      fullName: "Full name",
      fullNamePh: "First and last name",
      nationalId: "National ID",
      nationalIdPh: "e-Tazkira number",
      gender: "Gender",
      male: "Male",
      female: "Female",
      contactTitle: "Contact information",
      phone: "Phone number",
      email: "Email (optional)",
      luggageTitle: "Extra luggage (optional)",
      luggageOption: "I'd like to register extra luggage",
      luggageNote:
        "[PLACEHOLDER — needs real pricing from the company] The exact extra-luggage fee is not yet confirmed; if selected, this is finalized with the operator when boarding.",
      paymentTitle: "Payment method",
      payCard: "Bank card (online)",
      payCardDesc: "Secure online payment by bank card via the HesabPay gateway.",
      payMobile: "Mobile money (online)",
      payMobileDesc: "Online payment via your mobile wallet, through the same HesabPay gateway.",
      payOffice: "Offline payment",
      payOfficeDesc: "Pay in cash at the office or when boarding; the booking stays \"pending confirmation\" until paid.",
      summaryTitle: "Trip summary",
      route: "Route",
      date: "Date",
      seatsLabel: "Seats",
      subtotal: "Tickets subtotal",
      serviceFee: "Service fee",
      grandTotal: "Amount due",
      pay: "Pay and issue tickets",
      required: "This field is required",
      termsLabel: "I accept the booking terms & conditions and the privacy policy.",
      termsLink: "View terms & conditions",
      privacyLink: "Privacy policy",
      termsRequired: "You must accept the terms to continue",
    },
    confirm: {
      title: "Your booking is confirmed",
      subtitle: "Have a pleasant journey. Your ticket details were sent to your phone number.",
      ref: "Booking reference",
      route: "Route",
      date: "Travel date",
      departure: "Departure time",
      seats: "Seats",
      passenger: "Passenger",
      amount: "Amount paid",
      boarding: "Please arrive at the terminal 30 minutes before departure and keep your booking reference handy.",
      download: "Download ticket",
      addToCalendar: "Add to calendar",
      home: "Back to home",
      qrHint: "Show this QR code when boarding",
      supportTitle: "Emergency travel support",
      supportNote:
        "[PLACEHOLDER — needs the company's real support number] If anything comes up before or during your trip, reach us through the contact page or your nearest office.",
      contactOffices: "View support offices",
    },
    about: {
      kicker: "About us",
      title: "A network connecting Kabul to Herat",
      intro:
        "Shabraw carries passengers along Afghanistan's southwest corridor — from Kabul to Herat, stopping in Ghazni, Qalat, Kandahar, Helmand, Nimroz, and Farah — with a fleet of large intercity coaches and a regular timetable.",
      stats: [
        { label: "Years in operation" },
        { label: "Cities served" },
        { label: "Coaches in the fleet" },
        { label: "Daily departures" },
      ],
      statsPlaceholderNote: "[PLACEHOLDER] These figures will be completed once real numbers are provided by the company.",
      storyTitle: "Our story",
      storyBody:
        "Our network covers a single corridor: Kabul, Ghazni, Qalat, Kandahar, Helmand, Nimroz, Farah, and Herat. Passengers can book between any two points on this route.",
      safetyTitle: "Our commitment to safety and quality",
      safetyBody:
        "Every trip runs on model \"580\" coaches (Mercedes-Benz Travego/O580), built for long intercity journeys. Pre-departure technical checks and schedule reliability are core priorities.",
      fleetPhotoNote: "[PLACEHOLDER — needs real photos of the company's offices and coaches]",
      busTypesTitle: "Two service levels, one standard of comfort",
      busTypesIntro: "Depending on your route and budget, choose between two levels of service.",
      vipDesc:
        "A 1+2 layout with extra legroom and lower capacity than standard service, air conditioning, Wi-Fi, charging, and refreshments along the way.",
      standardDesc:
        "A 2+2 layout with comfortable seats and air conditioning — an affordable choice for everyday travel.",
      ctaTitle: "Ready for your next trip?",
      ctaButton: "Search trips",
    },
    contact: {
      kicker: "Contact us",
      title: "Get in touch",
      subtitle:
        "For in-person booking, tracking a ticket, or any other question, visit your nearest office or send us a message.",
      officesTitle: "Sales offices",
      hours: "Daily, 6 AM to 10 PM",
      hoursNote: "[PLACEHOLDER — each office's exact hours still need confirmation]",
      mapTitle: "Corridor map",
      mapNote: "This map shows the geographic order of cities we cover; a precise office map will be added once addresses are confirmed.",
      formTitle: "Send a message",
      formName: "Your name",
      formNamePh: "First and last name",
      formPhone: "Phone number",
      formMessage: "Message",
      formMessagePh: "Write your question or request…",
      formSubmit: "Send message",
      required: "This field is required",
      sent: "Your message has been sent. We'll contact you soon.",
    },
    faq: {
      kicker: "FAQ",
      title: "Frequently asked questions",
      subtitle: "Find answers to common questions about booking, payment, luggage, and our cancellation policy.",
      groups: [
        {
          title: "Booking",
          items: [
            {
              q: "Do I need an account to book?",
              a: "No. Bookings only require a phone number, and you'll receive a booking reference. Creating an account is optional.",
            },
            {
              q: "What's the maximum number of seats per booking?",
              a: "Up to six seats per booking. For larger groups, please contact your nearest office.",
            },
            {
              q: "Can I book a ticket for someone else?",
              a: "Yes. Just enter that person's name and national ID in the passenger form; the booking phone number can be your own.",
            },
          ],
        },
        {
          title: "Payment",
          items: [
            {
              q: "What payment methods are supported?",
              a: "Online payment by bank card or mobile money via the HesabPay gateway, as well as cash payment at the office or when boarding.",
            },
            {
              q: "If I choose offline payment, when is my ticket finalized?",
              a: "Offline-payment bookings are recorded as \"pending confirmation\" and finalized once the operator confirms payment.",
            },
            {
              q: "Is online payment secure?",
              a: "Online payment runs through the HesabPay gateway, and your card details are never stored directly on our servers.",
            },
          ],
        },
        {
          title: "Cancellation and refund policy",
          items: [
            {
              q: "Can I cancel my booking?",
              a: "Yes. Cancellations made 24 hours or more before departure are free and fully refunded. Cancellations within 24 hours of departure incur a 20% fee.",
            },
            {
              q: "How long does a refund take?",
              a: "Card and mobile-money refunds are usually processed within three to seven business days. Cash payments are refunded at the office where you booked.",
            },
            {
              q: "Can I change my travel date?",
              a: "Yes, date changes are free up to 12 hours before departure, subject to seat availability on the new trip.",
            },
          ],
        },
        {
          title: "Luggage and baggage",
          items: [
            {
              q: "How much luggage can I bring?",
              a: "[PLACEHOLDER — needs exact allowance from the company] The exact weight and size allowance is not yet confirmed; contact your office before travel for specifics.",
            },
            {
              q: "What if I have extra luggage?",
              a: "[PLACEHOLDER — needs real pricing from the company] You can select \"extra luggage\" on the booking form; the exact fee and terms are arranged with the operator when boarding.",
            },
            {
              q: "What items are prohibited?",
              a: "Flammable materials, weapons and ammunition, and hazardous or illegal goods are not permitted. Full details are on the luggage policy page.",
            },
          ],
        },
        {
          title: "On the day of travel",
          items: [
            {
              q: "How early should I arrive at the terminal?",
              a: "Please arrive at least 30 minutes before departure and keep your booking reference handy.",
            },
            {
              q: "Do children need a separate ticket?",
              a: "Children under 2 travelling on a parent's lap travel free; a full ticket is required for children over 2.",
            },
            {
              q: "Are there stops along the way?",
              a: "Yes, depending on the route length, one or more short stops are scheduled for rest and prayer.",
            },
          ],
        },
      ],
    },
    luggagePage: {
      kicker: "Travel policy",
      title: "Luggage and baggage policy",
      subtitle: "Check the allowed baggage, extra luggage terms, and prohibited items before you travel.",
      allowanceTitle: "Baggage allowance per passenger",
      allowanceBody: "[PLACEHOLDER — needs exact allowance from the company] The exact weight and size allowance (hold luggage and carry-on) has not yet been provided by the company.",
      extraTitle: "Extra luggage",
      extraBody:
        "[PLACEHOLDER — needs real pricing from the company] If you have luggage beyond the allowance, select \"extra luggage\" when booking. The exact fee and terms are arranged with the operator when boarding.",
      prohibitedTitle: "Prohibited items",
      prohibitedItems: [
        "Flammable or explosive materials",
        "Weapons, ammunition, and unpackaged sharp objects",
        "Hazardous or toxic chemicals",
        "Goods illegal under the laws of the Islamic Republic of Afghanistan",
      ],
      note: "This policy is a general framework and must be completed with the company's exact figures and terms before launch.",
    },
    terms: {
      kicker: "Terms & conditions",
      title: "Terms of use",
      updatedLabel: "Last updated",
      updatedValue: "[PLACEHOLDER]",
      notice:
        "[PLACEHOLDER — this is an initial framework and must be reviewed and completed by the company's legal/management team before launch.]",
      sections: [
        {
          heading: "1. Acceptance of terms",
          body: "By booking a ticket through this website, you accept the terms and conditions below.",
        },
        {
          heading: "2. Booking and ticket issuance",
          body: "Bookings are made by entering passenger details and a valid phone number. The digital ticket is issued once payment is confirmed.",
        },
        {
          heading: "3. Cancellation and refunds",
          body: "The cancellation and refund policy is described on the FAQ page and forms part of these terms.",
        },
        {
          heading: "4. Responsibility for luggage",
          body: "The passenger is responsible for accurately declaring luggage and following the luggage policy.",
        },
        {
          heading: "5. Schedule changes",
          body: "The company reserves the right to change or delay the travel schedule when necessary (weather, technical, or security conditions).",
        },
      ],
    },
    privacy: {
      kicker: "Privacy",
      title: "Privacy policy",
      updatedLabel: "Last updated",
      updatedValue: "[PLACEHOLDER]",
      notice:
        "[PLACEHOLDER — this is an initial framework and must be reviewed and completed by the company's legal/management team before launch.]",
      sections: [
        {
          heading: "1. Information we collect",
          body: "Passenger name, national ID number, phone number, and email if provided — collected solely to issue and track your ticket.",
        },
        {
          heading: "2. How we use it",
          body: "Your information is used only to manage your booking, send travel notifications, and provide customer support.",
        },
        {
          heading: "3. Sharing information",
          body: "Passenger information is not shared with third parties, aside from the payment gateway (to process transactions) and where required by law.",
        },
        {
          heading: "4. Data retention",
          body: "Booking information is retained for as long as needed for follow-up and internal reporting.",
        },
      ],
    },
    admin: {
      title: "Admin panel",
      subtitle: "Network operations overview",
      nav: {
        dashboard: "Dashboard",
        trips: "Trips",
        bookings: "Bookings",
        buses: "Fleet",
        routes: "Routes",
      },
      exit: "Exit panel",
      stats: {
        bookings: "Today's bookings",
        revenue: "Today's revenue",
        occupancy: "Avg. occupancy",
        trips: "Active trips",
      },
      vsYesterday: "vs. yesterday",
      recentTitle: "Recent bookings",
      recentSub: "Latest issued tickets",
      searchPh: "Search reference or passenger name…",
      upcomingTitle: "Upcoming trips",
      cols: {
        ref: "Ref",
        passenger: "Passenger",
        route: "Route",
        date: "Date",
        seats: "Seats",
        amount: "Amount",
        status: "Status",
        time: "Departs",
        occupancy: "Occupancy",
        bus: "Bus",
      },
      status: {
        confirmed: "Confirmed",
        pending: "Pending",
        cancelled: "Cancelled",
      },
      allStatuses: "All statuses",
    },
  },
}

/**
 * The real, confirmed operating corridor (from the company's approved office
 * list): a single southwest line from Kabul to Herat. Listed in geographic
 * order along that corridor. Do NOT add cities here without confirmation —
 * see claude_project-master-prompt.md "no-fabrication" rule.
 */
export const cities: { fa: string; en: string }[] = [
  { fa: "کابل", en: "Kabul" },
  { fa: "غزنی", en: "Ghazni" },
  { fa: "قلات", en: "Qalat" },
  { fa: "کندهار", en: "Kandahar" },
  { fa: "هلمند", en: "Helmand" },
  { fa: "نیمروز", en: "Nimroz" },
  { fa: "فراه", en: "Farah" },
  { fa: "هرات", en: "Herat" },
]

export type Route = {
  from: { fa: string; en: string }
  to: { fa: string; en: string }
  image: string
  hours: number
  price: number
  trips: number
  accent: string
}

/**
 * Sample routes for the homepage teaser strip. Prices/trip-counts are demo
 * values for the interactive booking flow (kept functional per the parent
 * project's UI/UX phase) — NOT the confirmed real pricing. The static
 * "Routes & prices" page shows explicit [PLACEHOLDER] pricing instead; see
 * routesPage.priceNote.
 */
export const popularRoutes: Route[] = [
  {
    from: { fa: "کابل", en: "Kabul" },
    to: { fa: "هرات", en: "Herat" },
    image: "/images/city-herat.png",
    hours: 13,
    price: 1800,
    trips: 6,
    accent: "var(--chart-1)",
  },
  {
    from: { fa: "کابل", en: "Kabul" },
    to: { fa: "کندهار", en: "Kandahar" },
    image: "/images/city-kandahar.png",
    hours: 6,
    price: 950,
    trips: 8,
    accent: "var(--chart-2)",
  },
  {
    from: { fa: "کندهار", en: "Kandahar" },
    to: { fa: "هرات", en: "Herat" },
    image: "/images/city-herat.png",
    hours: 7,
    price: 1000,
    trips: 5,
    accent: "var(--chart-4)",
  },
  {
    from: { fa: "کابل", en: "Kabul" },
    to: { fa: "غزنی", en: "Ghazni" },
    image: "/images/city-kabul.png",
    hours: 2,
    price: 300,
    trips: 10,
    accent: "var(--chart-3)",
  },
]

const faDigitMap: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
}

export function localizeNumber(value: number | string, lang: Lang): string {
  const str = typeof value === "number" ? value.toLocaleString("en-US") : value
  if (lang === "en") return str
  return str.replace(/[0-9]/g, (d) => faDigitMap[d] ?? d)
}

/**
 * Formats a percentage in each language's own convention: the "%" sign
 * comes before the number in Dari (e.g. "٪۸۰") and after it in English
 * (e.g. "80%").
 */
export function localizePercent(value: number, lang: Lang): string {
  const num = localizeNumber(value, lang)
  return lang === "fa" ? `%${num}` : `${num}%`
}
