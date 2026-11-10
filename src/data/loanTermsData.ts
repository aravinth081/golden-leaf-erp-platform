// ──────────────────────────────────────────────────
// Golden Leaf Finance — Sanction Letter & Terms and Conditions Data
// Source of Truth: IDFC FIRST Bank / Golden Leaf Finance NBFC Master Agreement
// Features: 28 Legal Clauses (English & தமிழ்) + Schedule of Charges (MID) + IT Act 2000 Declarations
// ──────────────────────────────────────────────────

export interface LegalClause {
  number: number;
  titleEn: string;
  titleTa: string;
  textEn: string;
  textTa: string;
}

export interface ScheduleItem {
  id: string;
  labelEn: string;
  labelTa: string;
  valueEn: string;
  valueTa: string;
  category: 'applicant' | 'financial' | 'charges' | 'delinquency' | 'officer';
}

export interface DefaultSanctionTemplate {
  companyNameEn: string;
  companyNameTa: string;
  companyRegEn: string;
  companyRegTa: string;
  registeredOfficeEn: string;
  registeredOfficeTa: string;
  contactEmail: string;
  customerCareNo: string;
  sampleApplicantEn: {
    applicantName: string;
    coApplicant1Name: string;
    coApplicant2Name: string;
    loanAccountNo: string;
    applicationDate: string;
    place: string;
    fixedRoi: number;
    loanAmount: number;
    tenureMonths: number;
    noOfEmis: number;
    tentativeEmi: number;
    loanPurpose: string;
    docCharges: number;
    gstCharges: number;
    lifeInsurance: number;
    generalInsurance: number;
    stampDuty: number;
    totalDeductions: number;
    foreclosureAmount: number;
    netDisbursement: number;
    repaymentMode: string;
    repaymentFrequency: string;
    emiDueDate: number;
    penalCharges: string;
    bounceCharges: string;
    swapCharges: string;
    foreclosureCharges: string;
    lockInDays: number;
    partPaymentCharges: string;
    authorisedOfficer: string;
    authorisedOfficerEmpId: string;
  };
  sampleApplicantTa: {
    applicantName: string;
    coApplicant1Name: string;
    coApplicant2Name: string;
    loanAccountNo: string;
    applicationDate: string;
    place: string;
    fixedRoi: number;
    loanAmount: number;
    tenureMonths: number;
    noOfEmis: number;
    tentativeEmi: number;
    loanPurpose: string;
    docCharges: number;
    gstCharges: number;
    lifeInsurance: number;
    generalInsurance: number;
    stampDuty: number;
    totalDeductions: number;
    foreclosureAmount: number;
    netDisbursement: number;
    repaymentMode: string;
    repaymentFrequency: string;
    emiDueDate: number;
    penalCharges: string;
    bounceCharges: string;
    swapCharges: string;
    foreclosureCharges: string;
    lockInDays: number;
    partPaymentCharges: string;
    authorisedOfficer: string;
    authorisedOfficerEmpId: string;
  };
}

export const SANCTION_TEMPLATE_METADATA: DefaultSanctionTemplate = {
  companyNameEn: 'Golden Leaf Finance Limited',
  companyNameTa: 'கோல்டன் லீஃப் பைனான்ஸ் லிமிடெட்',
  companyRegEn: 'RBI Registered NBFC-ND | CIN: U65923TN2020PLC138942',
  companyRegTa: 'ரிசர்வ் வங்கி பதிவுபெற்ற வங்கி சாரா நிதி நிறுவனம் | CIN: U65923TN2020PLC138942',
  registeredOfficeEn: 'Golden Leaf Towers, No. 42, 2nd Avenue, Anna Nagar East, Chennai - 600102, Tamil Nadu, India',
  registeredOfficeTa: 'கோல்டன் லீஃப் டவர்ஸ், எண். 42, 2-வது அவென்யூ, அண்ணா நகர் கிழக்கு, சென்னை - 600102, தமிழ்நாடு, இந்தியா',
  contactEmail: 'sampark@goldenleaffinance.com',
  customerCareNo: '1800 10 888',

  sampleApplicantEn: {
    applicantName: 'Applicant Name',
    coApplicant1Name: '—',
    coApplicant2Name: 'None',
    loanAccountNo: '—',
    applicationDate: '—',
    place: 'Main Branch',
    fixedRoi: 24.5,
    loanAmount: 100000,
    tenureMonths: 24,
    noOfEmis: 24,
    tentativeEmi: 5312,
    loanPurpose: 'RETAIL TRADE / VYAPAAR VRIDDHI',
    docCharges: 2000,
    gstCharges: 360,
    lifeInsurance: 2583,
    generalInsurance: 300,
    stampDuty: 0,
    totalDeductions: 5243,
    foreclosureAmount: 0,
    netDisbursement: 94757,
    repaymentMode: 'NACH (National Automated Clearing House)',
    repaymentFrequency: 'Monthly',
    emiDueDate: 3,
    penalCharges: '2% per month of the unpaid EMI or Rs. 300 whichever is higher',
    bounceCharges: '7.5% of the EMI outstanding + GST (minimum Rs. 400 + GST; maximum Rs. 1000 + GST)',
    swapCharges: 'INR 500/- + GST as applicable',
    foreclosureCharges: '4% of the principal outstanding amount + GST for standard accounts. For Micro & Small tagged applications – Nil charge',
    lockInDays: 180,
    partPaymentCharges: '4% of Principal Loan Outstanding + GST as applicable',
    authorisedOfficer: 'Authorized Officer',
    authorisedOfficerEmpId: '—',
  },

  sampleApplicantTa: {
    applicantName: 'விண்ணப்பதாரர் பெயர்',
    coApplicant1Name: 'இல்லை',
    coApplicant2Name: 'இல்லை',
    loanAccountNo: '—',
    applicationDate: '—',
    place: 'முதன்மை கிளை',
    fixedRoi: 26.5,
    loanAmount: 100000,
    tenureMonths: 24,
    noOfEmis: 24,
    tentativeEmi: 5312,
    loanPurpose: 'சில்லறை வர்த்தகம் / வியாபார் விருத்தி (RETAIL TRADE)',
    docCharges: 2000,
    gstCharges: 360,
    lifeInsurance: 2583,
    generalInsurance: 300,
    stampDuty: 0,
    totalDeductions: 5243,
    foreclosureAmount: 0,
    netDisbursement: 94757,
    repaymentMode: 'NACH (தேசிய தானியங்கி தீர்வு இல்லம்)',
    repaymentFrequency: 'மாதாந்திரம் (Monthly)',
    emiDueDate: 3,
    penalCharges: 'செலுத்தப்படாத EMI-ல் மாதத்திற்கு 2% அல்லது ரூ. 300, இதில் எது அதிகமோ அது',
    bounceCharges: 'நிலுவையில் உள்ள தவணை தொகையில் 7.5% + GST (குறைந்தபட்சம் ரூ. 400 + GST; அதிகபட்சம் ரூ. 1000 + GST)',
    swapCharges: 'ரூ. 500/- + பொருந்தக்கூடிய GST',
    foreclosureCharges: 'அசல் நிலுவைத் தொகையில் 4% + GST. குறு மற்றும் சிறு தொழில்களுக்கான விண்ணப்பங்களுக்கு - கட்டணம் இல்லை',
    lockInDays: 180,
    partPaymentCharges: 'அசல் நிலுவைத் தொகையில் 4% + பொருந்தக்கூடிய GST',
    authorisedOfficer: 'அங்கீகரிக்கப்பட்ட அதிகாரி',
    authorisedOfficerEmpId: '—',
  },
};

export const ELECTRONIC_RECORD_DECLARATIONS = {
  en: [
    {
      clauseNo: 1,
      text: 'I/We are aware that this document/Application is an electronic record in terms of Information Technology Act, 2000 and rules there under as applicable to electronic records in various statutes as amended by the Information Technology Act, 2000. This electronic record is generated by a computer system and does not require any physical signatures.',
    },
    {
      clauseNo: 2,
      text: 'Electronic communications shall be deemed to have been received by me/us, when the said electronic communication is sent to the email address / mobile number / details provided by me/us or any other third party. I/We shall not hold Golden Leaf Finance or its business partners/service providers/authorized third parties responsible for any such communications received, nor will any such communication amount to spam, unsolicited communication or a violation of registration on the national do not call registry.',
    },
    {
      clauseNo: 3,
      text: 'I/We hereby expressly acknowledge and confirm that I/We have read, verified, understood, irrevocably agreed to and accepted and delivered all the contents/terms and conditions contained in the Application Form, Key Fact Statement (collectively, "Loan Documents") online by ticking/clicking/checking the "I Agree" or "I Agree and Accept" or any similar icon/tab/option on the online system/Website/portal/platform as well as by entering the one-time password ("OTP") provided to my/our mobile number registered with the Company, and that there is no requirement of any other physical signature on the Loan Documents.',
    },
    {
      clauseNo: 4,
      text: 'I/We undertake and declare that if there are any changes in the particulars and information given by me/us while availing the Loan facility, I/We shall within 30 days from the date of any such change in the particulars and information disclose the details of such changes to Golden Leaf Finance without withholding the same.',
    },
  ],
  ta: [
    {
      clauseNo: 1,
      text: 'தகவல் தொழில்நுட்பச் சட்டம், 2000 மற்றும் தகவல் தொழில்நுட்பச் சட்டம் 2000 ஆல் திருத்தப்பட்ட பல்வேறு சட்டங்களில் உள்ள மின்னணு பதிவுகளுக்கு பொருந்தக்கூடிய விதிகள் ஆகியவற்றின் கீழ் இந்த ஆவணம்/விண்ணப்பம் ஒரு மின்னணு பதிவாகும் என்பதை நான்/நாங்கள் அறிவோம். இந்த மின்னணு பதிவு கணினி அமைப்பால் உருவாக்கப்பட்டது மற்றும் எந்த நேரடி உடல் கையொப்பங்களும் இதற்குத் தேவையில்லை.',
    },
    {
      clauseNo: 2,
      text: 'நான்/நாங்கள் அல்லது வேறு ஏதேனும் மூன்றாம் தரப்பினரால் வழங்கப்பட்ட மின்னஞ்சல் முகவரி / மொபைல் எண் / விவரங்களுக்கு மேற்படி மின்னணு தகவல் தொடர்பு அனுப்பப்படும் போது, மின்னணு தகவல் தொடர்புகள் என்னால்/எங்களால் பெறப்பட்டதாகக் கருதப்படும். கோல்டன் லீஃப் பைனான்ஸ் அல்லது அதன் வணிக பங்காளிகள்/சேவை வழங்குநர்கள்/அங்கீகரிக்கப்பட்ட மூன்றாம் தரப்பினரிடமிருந்து பெறப்படும் தகவல்களுக்கு அவர்களை பொறுப்பாக்க மாட்டோம்; இத்தகைய தொடர்புகள் தேசிய டூ-நாட்-கால் பதிவின் புறக்கணிப்பாகவோ அல்லது தேவையற்ற விளம்பரமாகவோ கருதப்படாது.',
    },
    {
      clauseNo: 3,
      text: '“நான் ஏற்றுக்கொள்கிறேன்” அல்லது “சம்மதிக்கிறேன்” அல்லது ஆன்லைன் போர்ட்டல்/பிளாட்ஃபாரத்தில் காணப்படும் அதே போன்ற ஐகான்/டேப் தேர்வில் டிக்/கிளிக் செய்வதன் மூலம் கடன் ஆவணங்கள் அனைத்தையும் நான்/நாங்கள் படித்தோம், சரிபார்த்தோம், மாற்றாமல் ஏற்றுக்கொண்டோம் என்பதை வெளிப்படையாக உறுதிப்படுத்துகிறோம். மேலும் பதிவு செய்த மொபைல் எண்ணில் அனுப்பப்படும் ஒருமுறை கடவுச்சொல்லை (OTP) பதிவு செய்வதன் மூலம் இது உறுதிப்படுத்தப்படுகிறது. கடன் ஆவணங்களில் நேரடி கையொப்பத்திற்கு அவசியம் இல்லை என்பதையும், நிறுவனம் இதனை ஏற்றுக் கொண்டதும் நடைமுறைக்கு வரும் என்பதையும் முழுமையாக ஒப்புக்கொள்கிறோம்.',
    },
    {
      clauseNo: 4,
      text: 'கடன் வசதியைப் பெறும்போது என்னால்/எங்களால் வழங்கப்பட்ட விவரங்கள் மற்றும் தகவல்களில் ஏதேனும் மாற்றங்கள் ஏற்பட்டால், அவற்றை மறைத்து வைக்காமல், அத்தகைய மாற்றம் ஏற்பட்ட நாளிலிருந்து 30 நாட்களுக்குள் அத்தகைய மாற்றங்களின் விவரங்களை நிறுவனத்திற்கு எழுத்துப்பூர்வமாக வெளிப்படுத்துவோம் என்று நான்/நாங்கள் உறுதியளிக்கிறோம்.',
    },
  ],
};

export const DELINQUENT_HANDLING_CHARGES = {
  en: [
    { rule: 1, fee: 'INR 750 (Excluding GST)', description: 'Where a notice has been delivered at the communication address and a paper publication is not required.' },
    { rule: 2, fee: 'INR 1,700 (Excluding GST)', description: 'Where no notice has been delivered at the communication address and the paper publication is to be done.' },
    { rule: 3, fee: 'INR 300 (Excluding GST)', description: 'Charge for sending auction notice over and above the preceding points 1 and 2.' },
    { rule: 4, fee: 'INR 200 (Excluding GST)', description: 'For sending Loan Recall notice over and above the preceding points 1 and 2.' },
  ],
  ta: [
    { rule: 1, fee: 'ரூ. 750 (GST தவிர்த்து)', description: 'தொடர்பு முகவரியில் அறிவிப்பு வழங்கப்பட்டு, செய்தித்தாள் வெளியீடு தேவையில்லை என்ற நிலையில்.' },
    { rule: 2, fee: 'ரூ. 1,700 (GST தவிர்த்து)', description: 'தொடர்பு முகவரியில் அறிவிப்பு வழங்கப்படாமல், செய்தித்தாள் பொது அறிவிப்பு வெளியிடப்பட வேண்டிய நிலையில்.' },
    { rule: 3, fee: 'ரூ. 300 (GST தவிர்த்து)', description: 'மேற்கண்ட விதிகள் 1 மற்றும் 2-க்கு கூடுதலாக பொது ஏல அறிவிப்பை அனுப்புவதற்கான கட்டணம்.' },
    { rule: 4, fee: 'ரூ. 200 (GST தவிர்த்து)', description: 'மேற்கண்ட விதிகள் 1 மற்றும் 2-க்கு கூடுதலாக கடன் திரும்பப் பெறுதல் (Loan Recall) அறிவிப்பு அனுப்புவதற்கான கட்டணம்.' },
  ],
};

export const LOAN_TERMS_28_CLAUSES: LegalClause[] = [
  {
    number: 1,
    titleEn: 'Sanction and Purpose of Facility',
    titleTa: 'கடன் அனுமதி மற்றும் பயன்பாட்டு நோக்கம்',
    textEn: `Pursuant to the application made by the Borrower in the Loan Application Form (“Application”), the Company/Bank has sanctioned the loan not exceeding the amount mentioned in the Schedule/MID hereto (hereinafter referred to as “Loan”), and the Borrower agrees to borrow the same, subject to and upon the terms and conditions contained in the Application and/or this document. The Borrower further declares that if he has already availed a prior loan facility, details of which are set out in the Schedule, the Borrower has requested foreclosure of the existing loan facility and to grant a fresh loan facility, executing fresh terms and conditions. The Borrower is aware that foreclosure and fresh facility is permitted only if the existing facility is a standard asset, neither overdue nor classified as an NPA, and all outstanding dues, overdues, charges, and interest shall be deducted from the net disbursal amount.`,
    textTa: `கடன் விண்ணப்பப் படிவத்தில் ("விண்ணப்பம்") கடன் பெறுபவர் செய்யும் விண்ணப்பத்தின் அடிப்படையில், நிறுவனம்/வங்கி அட்டவணை/MID-ல் குறிப்பிடப்பட்டுள்ள தொகைக்கு மிகாமல் கடனை ("கடன்") அனுமதித்துள்ளது; விண்ணப்பம் மற்றும்/அல்லது இந்த ஆவணத்தில் உள்ள விதிமுறைகள் மற்றும் நிபந்தனைகளுக்கு உட்பட்டு கடன் பெறுபவர் அத்தொகையை பெற ஒப்புக்கொள்கிறார். கடன் பெறுபவர் ஏற்கனவே ஒரு கடன் வசதியைப் பெற்றிருந்தால், அந்த முந்தைய கடனை முன்கூட்டியே முடித்துவிட்டு (Foreclosure), புதிய கடன் வசதியை வழங்குமாறு கோரியுள்ளார். முந்தைய கடன் முறையான ஸ்டாண்டர்ட் அசெட்டாக இருக்கும் பட்சத்தில் மட்டுமே இது அனுமதிக்கப்படும் என்பதையும், முந்தைய நிலுவைத் தொகைகள் புதிய கடன் விநியோகத் தொகையிலிருந்து கழிக்கப்படும் என்பதையும் கடன் பெறுபவர் நன்கு அறிவார்.`,
  },
  {
    number: 2,
    titleEn: 'Disbursement and Cancellation Rights',
    titleTa: 'கடன் விநியோகம் மற்றும் ரத்து செய்யும் உரிமைகள்',
    textEn: `The Company/Bank may disburse the Loan or any part thereof (“Disbursement”) at its own discretion. Disbursement under the Facility shall be deemed to be made on the date the cheque(s)/pay order(s)/authorizations/demand draft(s) are issued or when credit is transferred electronically via NEFT/RTGS/IMPS. Notwithstanding anything contained herein: (i) The Company/Bank may at its sole discretion, suspend or cancel the Loan if the same is not utilized within 15 days of the issuance of instrument/instruction for Disbursement, or (ii) The Borrower may cancel the Loan within 15 days of Disbursement provided that cancellation shall take effect only when the Borrower has refunded in full the total Outstanding Balance including all accrued interest and processing charges. The Borrower shall use the Loan only for the purpose stated in the Application and not for capital markets, speculative, or illegal purposes.`,
    textTa: `நிறுவனம்/வங்கி தனது சொந்த விருப்பத்தின் பேரில் கடன் அல்லது அதன் ஏதேனும் பகுதியை விநியோகம் செய்யலாம். காசோலை/பே-ஆர்டர்/அங்கீகாரம் வழங்கப்பட்ட தேதியில் அல்லது NEFT/RTGS மூலம் கணக்கில் வரவு வைக்கப்பட்ட தேதியில் கடன் வழங்கப்பட்டதாகக் கருதப்படும். (i) விநியோக உத்தரவு பிறப்பிக்கப்பட்ட 15 நாட்களுக்குள் கடன் பயன்படுத்தப்படாவிட்டால், நிறுவனம் கடனை ரத்து செய்ய உரிமை உண்டு; (ii) கடன் வழங்கப்பட்ட 15 நாட்களுக்குள் கடன் பெறுபவர் கடனை ரத்து செய்ய விரும்பினால், பெற்ற தொகை, வட்டி மற்றும் கட்டணங்கள் முழுவதையும் திருப்பிச் செலுத்துவதன் மூலம் ரத்து செய்யலாம். விண்ணப்பத்தில் குறிப்பிட்ட வணிக நோக்கத்திற்காக மட்டுமே கடன் பயன்படுத்தப்பட வேண்டும்; ஊக வணிகத்திற்கோ, பங்குச் சந்தை முதலீட்டிற்கோ அல்லது சட்டவிரோத செயல்களுக்கோ பயன்படுத்தப்படக் கூடாது.`,
  },
  {
    number: 3,
    titleEn: 'Repayment, Interest Calculation & Due Dates',
    titleTa: 'திருப்பிச் செலுத்துதல், வட்டி கணக்கீடு மற்றும் தவணை தேதிகள்',
    textEn: `The Loan, interest, penal charges, and incidental monies payable from time to time are collectively referred to as "Outstanding Balance". The Borrower shall pay interest on the Loan at the rate specified in the Schedule hereto, on the outstanding daily balance from the date of disbursement. The Company/Bank is entitled to change the rate of interest in accordance with regulatory directions of the Reserve Bank of India, which shall be intimated and binding on the Borrower. The Borrower shall repay the Loan and interest by way of Equated Monthly Instalments (EMIs) as specified in the Schedule (time being the essence of contract). The payment shall be made on or before the respective due dates without demand.`,
    textTa: `கடன், வட்டி, கூடுதல் கட்டணங்கள் மற்றும் இதர வரவுகள் அனைத்தும் "நிலுவைத் தொகை" எனப்படும். அட்டவணையில் குறிப்பிடப்பட்டுள்ள வட்டி விகிதத்தில், கடன் வழங்கப்பட்ட நாளிலிருந்து தினசரி நிலுவைத் தொகையின் மீது கடன் பெறுபவர் வட்டி செலுத்த வேண்டும். ரிசர்வ் வங்கியின் வழிகாட்டுதல்களின்படி வட்டி விகிதத்தை மாற்றியமைக்க நிறுவனத்திற்கு உரிமை உண்டு. அட்டவணையில் குறிப்பிடப்பட்டுள்ள தவணைத் தொகையை (EMI) உரிய தேதியில் அல்லது அதற்கு முன்னதாக கடன் பெறுபவர் எவ்வித நினைவூட்டலுமின்றி ஒழுங்காகச் செலுத்த வேண்டும்; காலந்தவறாமை இந்த ஒப்பந்தத்தின் மிக முக்கிய சாராம்சமாகும்.`,
  },
  {
    number: 4,
    titleEn: 'Stamp Duty, Taxes & Statutory Levies',
    titleTa: 'முத்திரைத்தாள் கட்டணம், வரிகள் மற்றும் சட்டப்பூர்வ கட்டணங்கள்',
    textEn: `The Borrower(s) shall pay to the Company/Bank (i) applicable stamp duty, registration charges, and documentation fees, (ii) all taxes including Goods & Services Tax (GST) as applicable on all fees, charges, and interest components, and (iii) all costs incurred in relation to recovery, legal enforcement, and issuance of demand notices. Any omission to collect stamp duty at inception shall not waive the Company's right to recover the same from the Borrower at any subsequent date.`,
    textTa: `கடன் பெறுபவர் (i) இந்த ஆவணத்திற்கான முத்திரைத்தாள் கட்டணம், பதிவு கட்டணம் மற்றும் ஆவணக் கட்டணங்கள், (ii) செயலாக்கக் கட்டணம் மற்றும் அனைத்து கட்டணங்கள் மீதான சரக்கு மற்றும் சேவை வரி (GST), மற்றும் (iii) கடன் வசூலிப்பு, சட்ட நடவடிக்கை மற்றும் நோட்டீஸ் அனுப்புவதற்கான செலவுகள் அனைத்தையும் முழுமையாக செலுத்த கடமைப்பட்டவர் ஆவார். தொடக்கத்தில் முத்திரைத்தாள் வசூலிக்கப்படாவிட்டாலும், அதனை பிற்காலத்தில் வசூலிக்கும் உரிமையை நிறுவனம் இழக்காது.`,
  },
  {
    number: 5,
    titleEn: 'Security & Hypothecation of Assets',
    titleTa: 'பிணையம் மற்றும் சொத்துக்கள் மீதான ஈடுரிமை',
    textEn: `The Borrower shall furnish and create such security from time to time as may be required by the Company/Bank. The Borrower hypothecates and charges all current and future business stocks, trade receivables, plant, machinery, furniture, fixtures, and business assets funded through the proceeds of this loan in favour of the Company/Bank until the entire loan is repaid and closed with a formal No Due Certificate.`,
    textTa: `நிறுவனம் அவ்வப்போது கோரும் பிணையங்களை கடன் பெறுபவர் வழங்க வேண்டும். இந்த கடனின் மூலம் உருவாக்கப்பட்ட அல்லது கடன் பெறுபவரின் வணிகத்தில் உள்ள அனைத்து இருப்புச் சரக்குகள், வரவேண்டிய பாக்கிகள், இயந்திரங்கள், தளவாடங்கள் மற்றும் உபகரணங்கள் மீது முழு கடனும் அடைக்கப்பட்டு 'தடையில்லாச் சான்றிதழ்' (NOC) வழங்கும் வரை நிறுவனத்திற்கு முதன்மை ஈடுரிமை (Hypothecation) உண்டு.`,
  },
  {
    number: 6,
    titleEn: 'Consequences of Default & Acceleration',
    titleTa: 'தவணை தவறுகையின் விளைவுகள் மற்றும் உடனடி வசூல்',
    textEn: `In case of any default in payment of EMI or breach of covenants, the Company/Bank shall without prejudice to its other rights, be entitled to recall the entire loan facility immediately. The entire Outstanding Balance shall become due and payable forthwith. The Company/Bank may initiate legal proceedings under the Negotiable Instruments Act, 1881, the Insolvency and Bankruptcy Code, or applicable civil and summary suits for recovery.`,
    textTa: `தவணை செலுத்துவதில் தாமதம் அல்லது ஒப்பந்த விதிமுறைகள் மீறப்பட்டால், நிறுவனம் தனது பிற உரிமைகளுக்கு குந்தகமின்றி, கடனை உடனடியாக திரும்பப் பெற (Recall) உரிமை உண்டு. கடன் பெறுபவர் ஒட்டுமொத்த நிலுவைத் தொகையையும் உடனடியாக திருப்பிச் செலுத்த வேண்டும். மேலும் 1881-ஆம் ஆண்டின் மாற்றத்தக்க ஆவணச் சட்டம் (Section 138), திவால் சட்டம் அல்லது உரிமையியல் நீதிமன்றங்கள் மூலம் சட்ட நடவடிக்கை எடுக்க நிறுவனத்திற்கு முழு அதிகாரம் உண்டு.`,
  },
  {
    number: 7,
    titleEn: 'Electronic Communications & Transmission Risk',
    titleTa: 'மின்னணு தகவல் தொடர்பு மற்றும் பரிமாற்ற இடர் ஏற்பு',
    textEn: `The Borrower understands and acknowledges that there are inherent risks involved in sending instructions, sanction letters, and account statements through internet, email, SMS, and instant messaging services. The Borrower agrees that Golden Leaf Finance shall not be liable for any unauthorized interception, transmission errors, or delays occurring due to telecommunication service failures beyond its reasonable control.`,
    textTa: `இன்டர்நெட், மின்னஞ்சல், SMS மற்றும் வாட்ஸ்அப் போன்ற தளங்கள் வழியாக தகவல்கள், அனுமதி கடிதங்கள் மற்றும் கணக்கு விவரங்களை அனுப்புவதில் உள்ள தொழில்நுடப இடர்களை கடன் பெறுபவர் நன்கு புரிந்துகொண்டுள்ளார். தொலைத்தொடர்பு பிழைகள் அல்லது நிறுவனத்தின் கட்டுப்பாட்டிற்கு அப்பாற்பட்ட தொழில்நுட்ப காரணங்களால் ஏற்படும் தாமதங்களுக்கு நிறுவனம் பொறுப்பேற்காது என்பதை ஒப்புக்கொள்கிறார்.`,
  },
  {
    number: 8,
    titleEn: 'Internet Banking, NACH & Digital Mandates',
    titleTa: 'இன்டர்நெட் பேங்கிங், NACH மற்றும் தானியங்கி கட்டளைகள்',
    textEn: `The Borrower shall be bound by the rules and regulations for National Automated Clearing House (NACH), Electronic Clearing System (ECS), and e-Mandates issued by National Payments Corporation of India (NPCI) and Reserve Bank of India. The Borrower undertakes to maintain sufficient balance in the designated bank account on or before each EMI due date. Cheque/mandate bounce shall attract statutory penal actions under Section 25 of the Payment and Settlement Systems Act, 2007.`,
    textTa: `NPCI மற்றும் ரிசர்வ் வங்கியால் வெளியிடப்பட்ட NACH, ECS மற்றும் e-Mandate விதிமுறைகளுக்கு கடன் பெறுபவர் கட்டுப்பட்டவர். ஒவ்வொரு EMI தவணை தேதிக்கு முன்னதாகவும் தனது வங்கிக் கணக்கில் போதிய இருப்புத் தொகையை பராமரிக்க வேண்டும். தவணைத் தொகை திரும்பினால் (Bounce), 2007-ஆம் ஆண்டின் பணம் செலுத்துதல் மற்றும் தீர்வு அமைப்புகள் சட்டம் பிரிவு 25-ன் கீழ் சட்ட நடவடிக்கை எடுக்கப்படும்.`,
  },
  {
    number: 9,
    titleEn: 'Insurance Coverage & Voluntary Declaration',
    titleTa: 'காப்பீட்டு பாதுகாப்பு மற்றும் விருப்பத் தேர்வு அறிவிப்பு',
    textEn: `The Borrower understands that Credit Life and General Asset Insurance is non-mandatory and voluntary. Where opted by the Borrower, the premium amount is deducted from the loan disbursal and remitted directly to the designated IRDAI-approved insurance company. In case of premature loan cancellation or foreclosure, the insurance cover shall be cancelled in accordance with the terms of the insurance underwriter, and pro-rata refunds (if any) shall be credited to the loan account.`,
    textTa: `கடன் ஆயுள் காப்பீடு மற்றும் பொதுக் காப்பீடு ஆகியவை கட்டாயமற்றவை, வாடிக்கையாளரின் விருப்பத்தின் பேரிலேயே வழங்கப்படுகின்றன. வாடிக்கையாளர் தேர்வு செய்தால், பிரீமியம் தொகை கடன் தொகையிலிருந்து கழிக்கப்பட்டு காப்பீட்டு நிறுவனத்திற்கு நேரடியாக செலுத்தப்படும். கடன் முன்கூட்டியே முடிக்கப்பட்டால், காப்பீட்டு நிறுவனத்தின் விதிகளின்படி காப்பீடு ரத்து செய்யப்பட்டு மீதித் தொகை (ஏதேனும் இருப்பின்) கடன் கணக்கில் வரவு வைக்கப்படும்.`,
  },
  {
    number: 10,
    titleEn: 'Representations and Warranties',
    titleTa: 'உறுதிமொழிகள் மற்றும் உத்தரவாதங்கள்',
    textEn: `Each Borrower represents and warrants that: (a) All information, KYC documents, PAN, Aadhaar, and financials provided in the Application are true, correct, and complete; (b) No insolvency, litigation, or criminal proceedings are pending against the Borrower; (c) The execution and performance of this loan does not violate any applicable law or contract; and (d) The business operations are validly registered under applicable local and statutory authorities.`,
    textTa: `கடன் பெறுபவர் உறுதி கூறுவது என்னவெனில்: (அ) விண்ணப்பத்தில் வழங்கப்பட்ட அனைத்து தகவல்கள், KYC ஆவணங்கள், ஆதார், பான் கார்டு மற்றும் நிதி விவரங்கள் உண்மையானவை மற்றும் சரியானவை; (ஆ) கடன் பெறுபவர் மீது திவால் அல்லது குற்றவியல் வழக்குகள் எதுவும் நிலுவையில் இல்லை; (இ) இந்த கடன் ஒப்பந்தம் எந்தவொரு சட்டத்தையும் அல்லது முந்தைய ஒப்பந்தங்களையும் மீறவில்லை; மற்றும் (ஈ) தொழில் நிறுவனம் சட்டப்பூர்வமாக பதிவு செய்யப்பட்டுள்ளது.`,
  },
  {
    number: 11,
    titleEn: 'Negative Covenants',
    titleTa: 'எதிர்மறை உடன்படிக்கைகள் மற்றும் கட்டுப்பாடுகள்',
    textEn: `The Borrower covenants and agrees that, during the subsistence of this Loan, without the prior written consent of the Company/Bank, the Borrower shall not: (a) Change the constitution, ownership structure, or core management of the enterprise; (b) Avail additional debt or encumber the hypothecated assets to third parties; (c) Divert loan funds to sister concerns, relatives, or speculative investments; or (d) Close the bank account mapped for NACH/e-Mandate deductions.`,
    textTa: `கடன் காலம் முழுவதும், நிறுவனத்தின் முன் எழுத்துப்பூர்வ அனுமதியின்றி கடன் பெறுபவர் பின்வருவனவற்றை செய்யக்கூடாது: (அ) நிறுவனத்தின் உரிமை அமைப்பை மாற்றுதல்; (ஆ) பிற நிதி நிறுவனங்களிடம் கூடுதல் கடன் பெறுதல் அல்லது பிணைய சொத்துக்களை பிறருக்கு அடமானம் வைத்தல்; (இ) கடன் நிதியை தொடர்புடைய நபர்களுக்கோ அல்லது பங்குச்சந்தை முதலீடுகளுக்கோ திருப்புதல்; (ஈ) NACH இணைக்கப்பட்டுள்ள வங்கிக் கணக்கை மூடுதல் அல்லது மாற்றுதல்.`,
  },
  {
    number: 12,
    titleEn: 'Events of Default',
    titleTa: 'தவறுதல் நிகழ்வுகள் (Events of Default)',
    textEn: `The following events shall constitute an Event of Default: (a) Default in the payment of any EMI or interest on the due date; (b) Material misrepresentation in documents submitted; (c) Cross default under any other credit facility with any bank/NBFC; (d) Disposal, attachment, or seizure of hypothecated business assets by legal authorities; (e) Insolvency, death, or dissolution of the Borrower or Co-borrower; or (f) Stoppage or abandonment of business operations for more than 30 consecutive days.`,
    textTa: `பின்வரும் நிகழ்வுகள் கடன் தவறுதலாகக் கருதப்படும்: (அ) தவணைத் தொகை அல்லது வட்டியை உரிய தேதியில் செலுத்தத் தவறுதல்; (ஆ) தவறான அல்லது போலி ஆவணங்களை சமர்ப்பித்தல்; (இ) பிற வங்கிகள் அல்லது NBFC-களில் வாங்கிய கடன்களில் தவணை தவறுதல்; (ஈ) பிணைய சொத்துக்கள் நீதிமன்றத்தால் பறிமுதல் செய்யப்படுதல்; (உ) கடன் வாங்குபவர் திவாலாதல் அல்லது மரணமடைதல்; (ஊ) தொடர்ந்து 30 நாட்களுக்கு மேல் வணிகத்தை மூடுதல் அல்லது கைவிடுதல்.`,
  },
  {
    number: 13,
    titleEn: 'Right to Accelerate and Enforce',
    titleTa: 'உடனடி முழு கடன் வசூலிப்பு மற்றும் சட்ட அமலாக்கம்',
    textEn: `Upon the occurrence of any Event of Default, the Company/Bank may, by written notice, declare the entire outstanding loan along with interest and charges immediately due and payable. The Company/Bank shall be entitled to take physical possession of hypothecated goods, inventory, and book debts, and sell them by public auction or private treaty to liquidate the outstanding liability without prejudice to deficiency recovery claims.`,
    textTa: `தவறுதல் நிகழ்வு ஏற்பட்டால், நிறுவனம் எழுத்துப்பூர்வ அறிவிப்பின் மூலம் ஒட்டுமொத்த நிலுவைக் கடனையும் உடனடியாக செலுத்தக் கோரலாம். பிணையமாக வைக்கப்பட்ட சரக்குகள், இயந்திரங்கள் மற்றும் விற்பனைப் பாக்கிகளை நிறுவனம் தனது கட்டுப்பாட்டில் எடுத்து, பொது ஏலம் அல்லது தனியார் விற்பனை மூலம் விற்று கடன் பாக்கியை ஈடுகட்ட முழு உரிமை பெறுகிறது.`,
  },
  {
    number: 14,
    titleEn: 'Securitisation, Assignment and Transfer',
    titleTa: 'கடன் உரிமைகளை மாற்றுதல் மற்றும் ஒப்படைத்தல்',
    textEn: `The Company/Bank shall have the absolute right to sell, assign, transfer, or securitise the Loan, receivables, underlying securities, and all benefits of this Agreement to any other bank, NBFC, financial institution, trust, or asset reconstruction company (ARC) without obtaining any further consent from or notice to the Borrower. The Borrower shall recognize such assignee as the new creditor.`,
    textTa: `கடன் பெறுபவரின் கூடுதல் அனுமதியின்றி, இந்த கடன் மற்றும் வரவேண்டிய தவணைகளை பிற வங்கிகள், நிதி நிறுவனங்கள், அறக்கட்டளைகள் அல்லது சொத்து மறுசீரமைப்பு நிறுவனங்களுக்கு (ARC) விற்பனை செய்யவோ அல்லது செக்யூரிடைசேஷன் மூலம் மாற்றவோ நிறுவனத்திற்கு முழு அதிகாரம் உண்டு. புதிய நிறுவனத்தை கடன் பெறுபவர் தனது புதிய கடன் வழங்குநராக ஏற்றுக்கொள்ள வேண்டும்.`,
  },
  {
    number: 15,
    titleEn: 'Third-Party Disclosure & Credit Bureau Reporting',
    titleTa: 'தகவல் பகிர்வு மற்றும் சிபில்/கிரெடிட் பீரோ பதிவு',
    textEn: `The Borrower authorizes the Company/Bank to disclose loan details, repayment track record, delinquency, and default to Credit Information Companies (CIBIL, Equifax, Experian, CRIF High Mark), Reserve Bank of India, statutory regulators, and contracted verification/recovery agencies. The Borrower acknowledges that default reporting will impair their overall credit rating and creditworthiness across the Indian banking ecosystem.`,
    textTa: `கடன் விவரங்கள், திருப்பிச் செலுத்தும் வரலாறு மற்றும் தவணை தவறுகை விவரங்களை CIBIL, Equifax, Experian, CRIF போன்ற கடன் தகவல் அமைப்புகளுக்கும், ரிசர்வ் வங்கிக்கும், சட்டரீதியான அமைப்புகளுக்கும் தெரிவிக்க நிறுவனத்திற்கு கடன் பெறுபவர் முழு அனுமதி அளிக்கிறார். தவணை தவறினால் அது சிபில் ஸ்கோரைப் பாதிக்கும் என்பதை கடன் பெறுபவர் உணர்ந்துள்ளார்.`,
  },
  {
    number: 16,
    titleEn: 'Appointment of Recovery Agencies',
    titleTa: 'மீட்பு முகவர்களை நியமித்தல் மற்றும் ஒழுங்குமுறை நடத்தை',
    textEn: `The Borrower expressly authorizes Golden Leaf Finance to appoint third-party recovery and collection agencies, field associates, and resolution officers to contact the Borrower for payment reconciliation. Such agencies shall strictly adhere to the RBI Fair Practices Code for NBFCs and shall not resort to unlawful harassment, intimidation, or indecent behavior.`,
    textTa: `நிலுவைத் தொகையை வசூலிக்க மூன்றாம் தரப்பு மீட்பு முகவர்கள் (Recovery Agents) மற்றும் கள அதிகாரிகளை நியமிக்க நிறுவனத்திற்கு கடன் பெறுபவர் அனுமதியளிக்கிறார். அத்தகைய முகவர்கள் ரிசர்வ் வங்கியின் நியாயமான நடத்தை விதிகளை (Fair Practices Code) கண்டிப்பாகப் பின்பற்றி நடப்பார்கள்.`,
  },
  {
    number: 17,
    titleEn: 'Anti-Money Laundering & Sanctions Compliance',
    titleTa: 'பணமோசடி தடுப்பு மற்றும் சட்டப்பூர்வ இணக்கம்',
    textEn: `The Borrower shall ensure that neither the Borrower, nor any partner/director, appears on the United Nations Sanctions list, FATF high-risk list, or the wilful defaulters list issued by RBI/CIBIL. The loan proceeds shall not be utilized for terrorist financing, money laundering, or narcotics trafficking as per the Prevention of Money Laundering Act, 2002 (PMLA).`,
    textTa: `கடன் வாங்குபவர் அல்லது அவரது பங்குதாரர்கள் ஐக்கிய நாடுகள் சபையின் தடைப்பட்டியலிலோ அல்லது ரிசர்வ் வங்கியின் வேண்டுமென்றே கடன் ஏய்த்தோர் (Wilful Defaulters) பட்டியலிலோ இடம்பெறவில்லை என்பதை உறுதிப்படுத்த வேண்டும். கடன் தொகை சட்டவிரோத பணமோசடி தடுப்புச் சட்டம் (PMLA 2002)-க்கு எதிரான காரியங்களுக்கு பயன்படுத்தப்படக் கூடாது.`,
  },
  {
    number: 18,
    titleEn: 'Retention of Records & Documents',
    titleTa: 'விண்ணப்ப ஆவணங்களை தக்கவைத்தல்',
    textEn: `The Company/Bank shall have the right to retain the Loan Application form, photographs, KYC proofs, address verifications, cheques, and supporting financial papers submitted by the Borrower irrespective of whether the loan is sanctioned, disbursed, or rejected, in accordance with statutory record retention mandates.`,
    textTa: `கடன் அனுமதிக்கப்பட்டாலும், நிராகரிக்கப்பட்டாலும் கடன் விண்ணப்பம், புகைப்படங்கள், KYC ஆவணங்கள், காசோலைகள் மற்றும் சான்றிதழ்களை தணிக்கை மற்றும் சட்ட விதிமுறைகளின்படி தனது ஆவணக் காப்பகத்தில் தக்கவைத்துக்கொள்ள நிறுவனத்திற்கு முழு உரிமை உண்டு.`,
  },
  {
    number: 19,
    titleEn: 'Notices, Communications and Service of Process',
    titleTa: 'அறிவிப்புகள் மற்றும் சட்டப்பூர்வ சமர்ப்பிப்புகள்',
    textEn: `Any notice, demand, or communication sent by Golden Leaf Finance by registered post, courier, email to the registered email address, or SMS to the registered mobile number shall be deemed to be duly served within 48 hours of dispatch. Service at the communication address provided in the application shall be deemed valid legal service of process.`,
    textTa: `பதிவுத் தபால், கூரியர், பதிவு செய்யப்பட்ட மின்னஞ்சல் அல்லது பதிவு செய்யப்பட்ட மொபைல் எண்ணிற்கு SMS வழியாக அனுப்பப்படும் அறிவிப்புகள் அனைத்தும் அனுப்பப்பட்ட 48 மணி நேரத்திற்குள் உரிய முறையில் சேர்ந்ததாகக் கருதப்படும். விண்ணப்பத்தில் குறிப்பிட்டுள்ள முகவரியே சட்டப்பூர்வ முகவரியாகக் கொள்ளப்படும்.`,
  },
  {
    number: 20,
    titleEn: 'Continuing Obligation & Joint and Several Liability',
    titleTa: 'தொடர் கடமை மற்றும் கூட்டு மற்றும் தனிநபர் பொறுப்பு',
    textEn: `The Borrower and Co-borrower(s) shall be jointly and severally liable to perform all repayment obligations until the final rupee of the Outstanding Balance is paid. The obligations hereunder shall be continuing, irrevocable, and binding on the heirs, executors, administrators, and legal representatives of the Borrower.`,
    textTa: `முழு நிலுவைத் தொகையும் முழுமையாக அடைக்கப்படும் வரை, கடன் வாங்குபவர் மற்றும் இணை விண்ணப்பதாரர்கள் அனைவரும் கூட்டாகவும், தனித்தனியாகவும் பொறுப்பாவார்கள். இந்த ஒப்பந்தக் கடமைகள் மாற்ற முடியாதவை மற்றும் கடன் பெறுபவரின் சட்டப்பூர்வ வாரிசுகளையும் கட்டுப்படுத்தும்.`,
  },
  {
    number: 21,
    titleEn: 'Grievance Redressal, Governing Law and Dispute Resolution',
    titleTa: 'குறைதீர்ப்பு, ஆளுகை சட்டம் மற்றும் சர்ச்சை தீர்வு',
    textEn: `(i) In case of grievances, the Borrower may contact the Principal Nodal Officer at Golden Leaf Towers, Anna Nagar, Chennai (Email: sampark@goldenleaffinance.com / Phone: 1800 10 888) or escalate to the RBI Ombudsman if unresolved within 30 days. (ii) This Agreement shall be governed by the laws of India. Any dispute arising out of this Agreement shall be referred to sole arbitration under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Chennai, and the courts in Chennai shall have exclusive jurisdiction.`,
    textTa: `(1) ஏதேனும் குறைகள் ஏற்பட்டால், கடன் வாங்குபவர் முதன்மை குறைதீர்ப்பு அலுவலரை (Nodal Officer, Golden Leaf Towers, Chennai, Email: sampark@goldenleaffinance.com / 1800 10 888) அணுகலாம்; 30 நாட்களுக்குள் தீர்வு கிடைக்காவிட்டால் ரிசர்வ் வங்கி குறைதீர்ப்பாளரிடம் முறையிடலாம். (2) இந்த ஒப்பந்தம் இந்திய சட்டங்களுக்கு உட்பட்டது. சர்ச்சைகள் எழும்பட்சத்தில், 1996-ஆம் ஆண்டின் நடுவர் மன்ற சட்டத்தின்படி நடுவர் விசாரணைக்கு உட்படுத்தப்படும். நடுவர் விசாரணை இடம் சென்னையாகும்; சென்னை நீதிமன்றங்களுக்கு மட்டுமே பிரத்தியேக அதிகார வரம்பு உண்டு.`,
  },
  {
    number: 22,
    titleEn: 'Verification & Voluntary Execution',
    titleTa: 'சரிபார்த்தல் மற்றும் சுயவிருப்ப கையொப்பம்',
    textEn: `The Borrower confirms having verified and understood all contents of this document, the schedule of charges, the Key Fact Statement (KFS), and having received a copy of the same. The Borrower confirms that the terms and conditions were explained in their vernacular language (Tamil/English) and affixes their physical or electronic signature voluntarily.`,
    textTa: `இந்த ஆவணத்தின் அனைத்து உள்ளடக்கங்கள், கட்டண அட்டவணை, முக்கிய தகவல் அறிக்கை (KFS) ஆகியவற்றை முழுமையாகப் படித்து, புரிந்துகொண்டு, அதன் நகலையும் பெற்றுக் கொண்டதை கடன் பெறுபவர் உறுதிப்படுத்துகிறார். அனைத்து விதிகளும் தனது தாய்மொழியில் (தமிழ்/ஆங்கிலம்) விளக்கப்பட்ட பின்னரே சுய விருப்பத்துடன் கையொப்பமிடுவதாக உறுதி கூறுகிறார்.`,
  },
  {
    number: 23,
    titleEn: 'Uncommitted Facility and Recall on Demand',
    titleTa: 'உறுதியளிக்கப்படாத வசதி மற்றும் எந்நேரமும் திரும்பப் பெறுதல்',
    textEn: `The credit facility granted is an uncommitted facility and is repayable on demand. The Company/Bank reserves the unconditional right to cancel, reduce, or suspend undisbursed portions of the facility at any time without assigning any reason or prior notice.`,
    textTa: `வழங்கப்படும் கடன் வசதிகள் உறுதியளிக்கப்படாத வசதிகளாகும்; கோரிக்கையின் பேரில் நிறுவனத்தால் திரும்பப் பெறப்படக்கூடியவை. முன்னறிவிப்பின்றி, எந்த காரணமும் கூறாமல் எந்நேரத்திலும் நிறுவனத்தால் கடன் வசதி பகுதியாகவோ அல்லது முழுமையாகவோ ரத்து செய்யப்படலாம்.`,
  },
  {
    number: 24,
    titleEn: 'Penal Charges for Default',
    titleTa: 'அபராதக் கட்டணங்கள் மற்றும் தாமதக் கட்டணக் கொள்கை',
    textEn: `Borrower is aware that penal charges are levied strictly as a deterrent against payment delays and not as a revenue enhancement mechanism, in full compliance with RBI guidelines on Fair Lending Practice - Penal Charges in Loan Accounts. Penal charges shall be levied separately without compounding on overdue EMI amounts.`,
    textTa: `அபராதக் கட்டணங்கள் என்பது கடன் வாங்குபவரால் பணம் செலுத்துவதில் ஏற்படும் தாமதத்தைத் தடுப்பதற்காக மட்டுமே விதிக்கப்படுகிறது என்பதை கடன் பெறுபவர் அறிவார். ரிசர்வ் வங்கியின் வழிகாட்டுதலின்படி, அபராதக் கட்டணங்களின் மீது கூட்டு வட்டி விதிக்கப்பட மாட்டாது.`,
  },
  {
    number: 25,
    titleEn: 'Red-Flagged Accounts & Fraud Mitigation',
    titleTa: 'சிவப்புக் கொடியிடப்பட்ட கணக்குகள் (Red Flagged Accounts)',
    textEn: `The Borrower understands and agrees that an account may be designated as a "Red Flagged Account" (RFA) upon the emergence of early warning signals of fraud, round-tripping of funds, forged invoices, or diversion of loan capital, triggering special audit and immediate loan recall.`,
    textTa: `ஒன்று அல்லது அதற்கு மேற்பட்ட முன்னெச்சரிக்கை சமிக்ஞைகள், மோசடி அல்லது நிதி தவறாகப் பயன்படுத்தப்படுவது குறித்த சந்தேகம் எழும்போது, கணக்கு "சிவப்புக் கொடியிடப்பட்ட கணக்காக" (Red Flagged Account) குறிக்கப்படும் என்பதையும், அது சிறப்பு தணிக்கை மற்றும் உடனடி வசூலுக்கு வழிவகுக்கும் என்பதையும் கடன் பெறுபவர் ஒப்புக்கொள்கிறார்.`,
  },
  {
    number: 26,
    titleEn: 'Right of Appropriation of Payments',
    titleTa: 'பணம் செலுத்துதல்களை ஒதுக்கீடு செய்யும் உரிமை (Appropriation)',
    textEn: `Notwithstanding Section 59, 60, and 61 of the Indian Contract Act, 1872, the Company/Bank shall have the sole right to appropriate any payments received from the Borrower towards dues in the following order: (i) statutory levies and legal recovery expenses, (ii) penal and incidental charges, (iii) overdue interest, (iv) current interest, and (v) principal outstanding balance.`,
    textTa: `இந்திய ஒப்பந்தச் சட்டம், 1872-ன் விதிகள் எதுவாக இருந்தாலும், கடன் பெறுபவரிடமிருந்து பெறப்படும் தொகையை பின்வரும் வரிசையில் வரவு வைக்க நிறுவனத்திற்கு முழு விருப்ப உரிமை உண்டு: (i) சட்டப்பூர்வ மற்றும் நீதிமன்ற செலவுகள், (ii) அபராத மற்றும் பிற கட்டணங்கள், (iii) நிலுவை வட்டி, (iv) நடப்பு வட்டி, மற்றும் (v) அசல் நிலுவைத் தொகை.`,
  },
  {
    number: 27,
    titleEn: 'Para-Banking Services & Regulatory Directives',
    titleTa: 'துணை வங்கிச் சேவைகள் மற்றும் ஒழுங்குமுறை உத்தரவுகள்',
    textEn: `Any para-banking or ancillary financial products (insurance, digital wallets, credit cards, payment gateway services) offered to the Borrower shall strictly conform to prevailing master directions issued by the Reserve Bank of India, IRDAI, and statutory authorities. The Borrower has the unconditional freedom to opt in or opt out of ancillary services.`,
    textTa: `கடன் பெறுபவருக்கு வழங்கப்படும் துணை நிதிச் சேவைகள் (காப்பீடு, டிஜிட்டல் வாலெட்கள், பணம் செலுத்தும் தளங்கள் போன்றவை) இந்திய ரிசர்வ் வங்கி மற்றும் IRDAI அவ்வப்போது வெளியிடும் நடைமுறை வழிகாட்டுதல்களுக்கு உட்பட்டதாக இருக்கும். கூடுதல் சேவைகளை ஏற்பதும் நிராகரிப்பதும் கடன் பெறுபவரின் தனிப்பட்ட விருப்பமாகும்.`,
  },
  {
    number: 28,
    titleEn: 'Interest on Outstanding Calendar Month Balance',
    titleTa: 'மாதாந்திர நிலுவை மீதான வட்டிப் பொறுப்பு',
    textEn: `Borrower shall be liable to pay interest on the outstanding loan balance for the complete month if the loan balance remains unpaid on the 1st day of each subsequent calendar month, in accordance with the standard amortization schedule and interest calculation methodology stipulated by the Company/Bank.`,
    textTa: `ஒவ்வொரு தொடர்ச்சியான காலண்டர் மாதத்தின் 1-ஆம் தேதியன்று கடன் தவணை நிலுவையில் இருந்தால், நிறுவனத்தின் வட்டி கணக்கீட்டு முறையின்படி அந்த முழு மாதத்திற்கான நிலுவைத் தொகைக்கான வட்டியைச் செலுத்த கடன் வாங்குபவர் பொறுப்பாவார்.`,
  },
];
