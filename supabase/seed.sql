-- ============================================================
-- Issa Compass — Seed Data
-- Immigration paths and steps for Phase 1
-- ============================================================

-- ============================================================
-- Immigration Paths
-- ============================================================
INSERT INTO paths (id, label, description, target_personas) VALUES
  ('non_b_to_wp_professional', 'Non-B Visa + Work Permit (Employee)', 'Standard route for white-collar professionals employed by a Thai or foreign company operating in Thailand.', ARRAY['professional']),
  ('mou_worker', 'MOU Migrant Worker', 'Formalized pathway for workers from Myanmar, Laos, and Cambodia under Memoranda of Understanding with Thailand.', ARRAY['worker']),
  ('ltr_visa', 'Long-Term Resident (LTR) Visa', 'Premium visa for remote workers, retirees, and skilled professionals wanting to live in Thailand long-term without a traditional work permit.', ARRAY['nomad', 'professional']),
  ('smart_visa', 'SMART Visa', 'BOI-backed visa for highly skilled professionals, investors, and startup executives. Combines work authorization and long-stay privilege.', ARRAY['professional']),
  ('non_b_self_employed', 'Non-B Visa + Work Permit (Own Company)', 'Route for entrepreneurs forming their own Thai company (usually a Thai limited company with BOI or non-BOI structure).', ARRAY['professional', 'nomad']),
  ('digital_nomad_grey', 'Digital Nomad (Grey Area / TR60)', 'Pragmatic guide to working remotely from Thailand on a tourist visa, including legal risks, best practices, and upgrade paths.', ARRAY['nomad']),
  ('border_run_strategy', 'Visa Exempt Extension Strategy', 'Short-term tactics for extending your stay in Thailand while sorting longer-term visa options.', ARRAY['nomad', 'worker']),
  ('non_o_dependent', 'Dependent / Spouse of Thai National', 'Non-Immigrant O visa route for foreign spouses and dependents of Thai nationals.', ARRAY['professional', 'worker'])
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Path: non_b_to_wp_professional (6 steps)
-- ============================================================
WITH path AS (SELECT 'non_b_to_wp_professional'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Obtain a Non-Immigrant B (Business) Visa',
  'Apply for a Non-B visa at a Thai consulate or embassy in your home country before entering Thailand. This is the foundation — you cannot legally work in Thailand on a tourist visa or visa exemption.',
  'Without a valid Non-B visa, your employer cannot submit a work permit application. Working without the correct visa is a criminal offence under the Immigration Act B.E. 2522.',
  '3–10 business days at consulate',
  ARRAY['Passport (valid 18+ months)', 'Employer''s invitation letter on company letterhead', 'Copy of company''s DBD registration + affidavit', 'Employment contract or offer letter', 'Recent passport photos (2)', 'Bank statement (sometimes requested)'],
  ARRAY['https://consular.mfa.go.th/', 'https://www.mfa.go.th/en/'],
  ARRAY['Apply at the Thai embassy/consulate in your home country for the smoothest experience — some consulates in neighboring countries have longer queues and stricter requirements.', 'The Non-B is typically issued as a 90-day single-entry visa. You must apply for your work permit before it expires.', 'Your employer''s HR team should prepare the invitation letter — request it early as company documents may need notarization.']
),
(
  (SELECT path_id FROM path), 2,
  'Employer Submits Work Permit Application',
  'Your Thai employer (or their authorized representative) submits a work permit application on your behalf to the Department of Employment (DoE). You cannot submit this yourself.',
  'The Work Permit is your legal authorization to work in Thailand. It specifies your employer, job position, and work location. Working without one carries fines of up to 100,000 THB and possible deportation.',
  '5–7 business days after submission',
  ARRAY['Original passport with valid Non-B visa', 'Three 1-inch passport photos', 'Medical certificate (from Thai clinic, dated within 30 days)', 'Copy of educational qualifications (degree certificates)', 'Company documents: DBD affidavit, balance sheet, list of Thai employees, social security registration'],
  ARRAY['https://www.doe.go.th/'],
  ARRAY['The ratio of Thai to foreign employees matters: generally 4 Thai employees per 1 foreign worker, though BOI companies have exemptions.', 'The medical certificate must be from a licensed Thai medical facility.', 'Your employer''s HR/legal team manages this — stay in close communication and provide documents promptly.']
),
(
  (SELECT path_id FROM path), 3,
  'Collect Your Work Permit at the Department of Employment',
  'You must appear in person at the DoE office (or the DoE counter at your province''s Employment Office) to collect your work permit book. Your employer or their representative should accompany you.',
  'The physical work permit booklet is a legal document you must carry at work at all times. Not having it on your person during an inspection is a violation.',
  '1 day (in-person visit)',
  ARRAY['Original passport', 'Receipt from initial application submission'],
  ARRAY['https://www.doe.go.th/', 'https://www.google.com/maps/search/Department+of+Employment+Bangkok'],
  ARRAY['Bring your original passport — photocopies are not accepted for collection.', 'The DoE''s main Bangkok office is at Mitmaitri Road, Dindaeng. Provincial offices serve workers outside Bangkok.', 'Your work permit book lists your employer and job title. Any change (new employer, new role) requires a new permit application.']
),
(
  (SELECT path_id FROM path), 4,
  'Register with the Revenue Department (Get Your Tax ID)',
  'Within 60 days of starting work, register with the Revenue Department to obtain your Thai Tax Identification Number (TIN). Your employer may handle payroll tax, but personal TIN registration is your responsibility.',
  'Required for filing annual personal income tax returns, opening some bank accounts, and property transactions. Failure to register or file taxes can result in penalties.',
  '1 day (in-person or online)',
  ARRAY['Work permit (original)', 'Passport', 'Proof of address in Thailand (rental contract or utility bill)', 'Employer''s tax registration documents (your HR can provide)'],
  ARRAY['https://www.rd.go.th/english/'],
  ARRAY['Personal income tax in Thailand is progressive (0–35%). Your employer typically withholds tax from salary.', 'The tax year runs January–December; personal returns are due by March 31 of the following year.', 'You can also register online via the Revenue Department''s e-filing portal.']
),
(
  (SELECT path_id FROM path), 5,
  'Open a Thai Bank Account',
  'Open a personal bank account at a major Thai bank (Bangkok Bank, Kasikorn Bank, SCB, or Krungthai Bank are the most foreigner-friendly).',
  'Required for receiving salary, paying bills, and many administrative processes. Some landlords and government services require a local bank account.',
  '1–3 days',
  ARRAY['Passport', 'Work permit (original)', 'Proof of address (rental contract or utility bill)', 'Employer''s letter confirming employment (some banks require)'],
  ARRAY['https://www.bangkokbank.com/', 'https://www.kasikornbank.com/en'],
  ARRAY['Kasikorn Bank (KBank) and Bangkok Bank are generally most foreigner-friendly; bring all documents even if not listed.', 'Some branches are more experienced with expat accounts — larger branches in business districts tend to process faster.', 'You''ll receive a Thai bank passbook and a debit card. Internet banking setup is straightforward.']
),
(
  (SELECT path_id FROM path), 6,
  'Set Up Annual Renewal Reminders',
  'Your Non-B visa and Work Permit both require annual renewal. Set calendar reminders 60 days before expiry for both.',
  'Overstaying a visa is a serious offence. An expired work permit means you are working illegally even if your visa is valid. Renewals must be initiated by your employer (for WP) and yourself (for visa).',
  'Ongoing',
  ARRAY[]::text[],
  ARRAY['https://www.doe.go.th/', 'https://www.immigration.go.th/'],
  ARRAY['Work Permit renewal: start the process 30–45 days before expiry. Your employer initiates this.', 'Non-B visa: you''ll typically do a border run or embassy visit to renew. Many expats use a visa agent for convenience.', 'Keep digital and physical copies of all immigration documents in a safe place.']
);


-- ============================================================
-- Path: mou_worker (5 steps)
-- ============================================================
WITH path AS (SELECT 'mou_worker'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Register with Your Country''s Sending Agency',
  'In Myanmar, Laos, or Cambodia, register with a government-approved sending agency. This is the legal starting point for the MOU worker pathway.',
  'Working through official MOU channels provides legal protection, access to Thai social security, and fair recruitment standards. Illegal border crossing or using unlicensed brokers exposes you to exploitation and arrest.',
  '1–4 weeks',
  ARRAY['National ID card', 'Birth certificate', 'Passport (or apply for one)', 'Medical certificate', 'Criminal background check'],
  ARRAY['https://www.doe.go.th/mou', 'https://mol.gov.mm/'],
  ARRAY['Use only licensed recruitment agencies registered with your national labor ministry.', 'Never pay fees exceeding the government-set maximum — if asked for more, report it.', 'Myanmar nationals can check approved agencies via the Ministry of Labour, Immigration and Population (MOIP).']
),
(
  (SELECT path_id FROM path), 2,
  'Complete Pre-Departure Orientation',
  'Attend a mandatory pre-departure orientation training covering Thai labor law, your rights as a worker, health and safety, and how to access help if needed.',
  'Knowing your rights before arriving protects you from exploitation. You''ll learn what to do if your employer doesn''t pay wages or mistreats you.',
  '1–2 days',
  ARRAY['Registration confirmation from sending agency'],
  ARRAY['https://www.doe.go.th/'],
  ARRAY['Take notes on emergency contacts: the Thai Ministry of Labour hotline is 1694.', 'Save the Thai Embassy contact in your home country before you travel.']
),
(
  (SELECT path_id FROM path), 3,
  'Enter Thailand and Receive Your Work Permit',
  'Travel to Thailand through a designated MOU entry point. Your employer or their agent will meet you and process your work permit and visa at the border.',
  'You must enter Thailand through the correct channels. Unauthorized entry can result in detention and deportation even if you later have a job offer.',
  '1–3 days at border processing',
  ARRAY['Passport with MOU visa stamp', 'Medical certificate (Thai-recognized facility)', 'Employer confirmation letter', 'MLSW-approved recruitment documents'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['Common MOU entry points: Mae Sot (Myanmar), Mukdahan (Laos), Sa Kaeo (Cambodia).', 'Your employer should arrange transportation from the border to your workplace.']
),
(
  (SELECT path_id FROM path), 4,
  'Register for Thai Social Security',
  'Within 30 days of starting work, your employer must register you with the Social Security Office (SSO). Confirm this has been done.',
  'Social security gives you access to healthcare, injury compensation, and other benefits. It is your employer''s legal obligation to register you.',
  '1–2 weeks after arrival',
  ARRAY['Passport', 'Work permit', 'Employer registration confirmation'],
  ARRAY['https://www.sso.go.th/'],
  ARRAY['Ask your employer for your SSO card or registration number within the first month.', 'If your employer fails to register you, you can report this to the Labour Protection Office (กรมสวัสดิการและคุ้มครองแรงงาน).']
),
(
  (SELECT path_id FROM path), 5,
  'Understand Your Rights and Support Channels',
  'Know where to go for help if you face problems with your employer: unpaid wages, unsafe conditions, or abuse.',
  'Many migrant workers face exploitation because they don''t know their rights or are afraid to report problems. Thai law protects all workers regardless of nationality.',
  'Ongoing',
  ARRAY[]::text[],
  ARRAY['https://www.mol.go.th/', 'https://www.hrw.org/thailand'],
  ARRAY['Thai Labour Protection Act covers all workers — including migrants — for minimum wage, overtime, and safe conditions.', 'Key contacts: Ministry of Labour hotline: 1694 | Labour Protection Office | Thai NGOs: Migrant Working Group, MAP Foundation (Chiang Mai).', 'Keep copies of your passport, work permit, and employment contract in a safe place away from your employer.']
);


-- ============================================================
-- Path: ltr_visa (5 steps)
-- ============================================================
WITH path AS (SELECT 'ltr_visa'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Confirm LTR Visa Eligibility',
  'The Long-Term Resident (LTR) Visa has four categories: Wealthy Global Citizen, Wealthy Pensioner, Work-from-Thailand Professional, and Highly Skilled Professional. Determine which category applies to you.',
  'Each category has distinct income, asset, and employer requirements. Applying for the wrong category wastes time and fees.',
  '1–2 days research',
  ARRAY[]::text[],
  ARRAY['https://ltr.boi.go.th/'],
  ARRAY['Work-from-Thailand Professional: requires minimum USD 80,000 annual income from an overseas employer, OR USD 40,000 with a Master''s degree or listed skills.', 'Highly Skilled Professional: requires employment with a Thai company in a targeted industry (EEC sectors, digital, healthcare, etc.).', 'The BOI''s LTR portal has an eligibility checker — use it before applying.']
),
(
  (SELECT path_id FROM path), 2,
  'Gather Required Documents',
  'Compile the documents required for your LTR category. The Work-from-Thailand Professional category is most relevant for digital nomads.',
  'Incomplete applications are returned, causing significant delays. Document requirements are strict and must be certified.',
  '1–2 weeks',
  ARRAY['Passport (valid 18+ months)', 'Proof of income (3 months payslips or employment letter confirming salary)', 'Employment contract with overseas company', 'Proof of health insurance (min. USD 50,000 coverage)', 'Bank statement showing USD 80,000+ income or qualifying assets', 'Criminal background check (from home country, apostilled)', 'Passport-size photos'],
  ARRAY['https://ltr.boi.go.th/en/requirement'],
  ARRAY['Health insurance must cover treatment in Thailand — check your policy explicitly covers Thai healthcare.', 'All foreign documents typically need to be notarized and apostilled. Budget time for this.', 'Bank statements should show consistent income — lump-sum deposits close to the application date raise flags.']
),
(
  (SELECT path_id FROM path), 3,
  'Submit LTR Application via BOI Portal',
  'Apply online through the BOI''s LTR visa portal. You can submit and track your application entirely online before your Thailand entry.',
  'The LTR is processed by the BOI, not the traditional consulate system. Using the correct portal ensures faster processing and status tracking.',
  '20 business days for BOI approval',
  ARRAY['Completed online application form', 'All supporting documents (scanned/uploaded)'],
  ARRAY['https://ltr.boi.go.th/'],
  ARRAY['BOI approval comes first — then you collect the actual visa stamp at a Thai embassy/consulate or on arrival (if already in Thailand at an Immigration office).', 'Track your application status through the BOI portal — no need to follow up by phone.', 'The application fee is THB 50,000 (approximately USD 1,400) per person — non-refundable.']
),
(
  (SELECT path_id FROM path), 4,
  'Obtain LTR Visa Stamp and Digital Work Permit',
  'After BOI approval, collect your LTR visa stamp. Work-from-Thailand professionals also receive a digital Work Permit (DWP) — a simplified permit specifically for remote workers.',
  'The Digital Work Permit is a major benefit of the LTR — it covers working for overseas employers from Thailand legally, without the standard 4:1 Thai employee ratio requirement.',
  '1–5 business days at immigration',
  ARRAY['BOI approval letter', 'Passport', 'Application fee receipt'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['If you''re already in Thailand, visit the One Stop Service Center at Chamchuri Square (Bangkok) or a provincial immigration office.', 'If outside Thailand, collect the stamp at a Thai embassy in your country.', 'The LTR is a 10-year visa (renewable), valid for 5+5 years.']
),
(
  (SELECT path_id FROM path), 5,
  'Annual Reporting and Renewal',
  'LTR visa holders must report their address to immigration every 90 days (90-day reporting) and complete annual digital check-ins via the BOI portal.',
  'Failure to complete 90-day reporting results in fines (THB 2,000 per occurrence). Failure to maintain qualifying income/insurance can result in LTR cancellation.',
  'Ongoing',
  ARRAY[]::text[],
  ARRAY['https://ltr.boi.go.th/', 'https://www.immigration.go.th/'],
  ARRAY['90-day reporting can be done online via the Immigration Bureau''s website or app — no in-person visit required.', 'Set calendar reminders for your annual BOI check-in (usually via portal — confirm current requirements at ltr.boi.go.th).', 'Keep your health insurance active and your income evidence up to date.']
);


-- ============================================================
-- Path: smart_visa (5 steps)
-- ============================================================
WITH path AS (SELECT 'smart_visa'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Confirm SMART Visa Category and Eligibility',
  'The SMART Visa has four categories: T (Talent — highly skilled professionals), I (Investor), E (Executive), and S (Startup). Each has distinct income, employer, and industry requirements. Determine which applies before applying.',
  'Applying under the wrong category wastes time and money. Each category is endorsed by a different government agency, so category selection determines your entire application path.',
  '1–2 days research',
  ARRAY[]::text[],
  ARRAY['https://www.boi.go.th/en/index/', 'https://smart-visa.boi.go.th/smart/'],
  ARRAY['Category T (Talent): requires employment with a BOI-promoted company or target industry company, minimum salary THB 100,000/month.', 'Category E (Executive): C-suite or senior management at a BOI-promoted company, minimum salary THB 200,000/month.', 'Category S (Startup): must be accepted into a government-recognized startup incubator or accelerator program.', 'Category I (Investor): must invest at least THB 20 million in a target industry or BOI-promoted entity.', 'The BOI''s SMART Visa portal has an eligibility self-check — start there before gathering documents.']
),
(
  (SELECT path_id FROM path), 2,
  'Obtain Endorsement from the Relevant Government Agency',
  'Before applying for the visa itself, you need a formal endorsement letter from the agency that governs your category. This is an additional step compared to standard visa processes.',
  'The SMART Visa is unique in that a government agency must vouch for you before Immigration will issue the visa. Without this endorsement, your application will not be accepted.',
  '10–30 business days depending on agency',
  ARRAY['Curriculum vitae / resume', 'Academic qualifications (degree certificates)', 'Employment contract or offer letter with salary confirmation', 'Company''s BOI promotion certificate (employer provides)', 'Proof of relevant expertise (patents, publications, portfolio as applicable)'],
  ARRAY['https://smart-visa.boi.go.th/smart/', 'https://www.boi.go.th/en/index/'],
  ARRAY['Category T/E endorsements are issued by the BOI. Apply via the SMART Visa online portal.', 'Category S endorsements come from NESDC, DEPA, or other designated startup agencies depending on your sector.', 'The endorsement is valid for 30 days — do not apply for it until you are ready to immediately submit your visa application.', 'Your employer''s BOI promotion letter is usually the most critical document — confirm your employer holds active BOI promotion status.']
),
(
  (SELECT path_id FROM path), 3,
  'Submit SMART Visa Application at an Immigration Office',
  'With your endorsement in hand, apply for the SMART Visa at the One Stop Service Center at Chamchuri Square (Bangkok), or a designated provincial immigration office. The visa is issued in Thailand — not at an overseas consulate.',
  'The SMART Visa is processed entirely within Thailand. If you are currently outside Thailand, enter on a Non-B or tourist visa first, then apply in-country.',
  '1–3 business days after document submission',
  ARRAY['Passport (valid 18+ months)', 'Endorsement letter from qualifying agency', 'Completed TM.87 application form', 'Passport-size photos (2)', 'Proof of health insurance (minimum THB 40,000 coverage for outpatient, THB 4 million for inpatient)', 'Employment contract or proof of investment', 'Application fee payment'],
  ARRAY['https://www.immigration.go.th/', 'https://smart-visa.boi.go.th/smart/'],
  ARRAY['The One Stop Service Center at Chamchuri Square, Bangkok is the primary processing center — it handles most SMART Visa applications.', 'The SMART Visa application fee is THB 10,000 per year of stay requested (up to 4 years = THB 40,000).', 'SMART Visa holders do NOT need a separate Work Permit — the visa itself authorizes employment. This is a major advantage over the standard Non-B + WP route.', 'Dependents (spouse and children under 20) can receive Non-O visas valid for the same duration as your SMART Visa.']
),
(
  (SELECT path_id FROM path), 4,
  'Understand Your SMART Visa Privileges',
  'The SMART Visa comes with significant privileges beyond a standard work visa: up to 4 years of stay, no work permit required, annual 90-day reporting (instead of quarterly), and a fast-track immigration lane at major airports.',
  'Knowing your privileges prevents you from unnecessarily complying with requirements that do not apply to you (e.g. obtaining a work permit) and helps you plan your stay and travel efficiently.',
  '1 day (self-study)',
  ARRAY[]::text[],
  ARRAY['https://smart-visa.boi.go.th/smart/', 'https://www.boi.go.th/en/index/'],
  ARRAY['90-day address reporting: SMART Visa holders report once per year via the BOI portal, not every 90 days at immigration. This is a major convenience advantage.', 'Re-entry permits: you can travel abroad and re-enter without losing your SMART Visa status. A multiple re-entry permit is recommended.', 'Fast-track lanes at Suvarnabhumi and Don Mueang airports are available — look for the "SMART Visa" signage.', 'You are permitted to work for multiple BOI-promoted companies simultaneously, subject to BOI approval.']
),
(
  (SELECT path_id FROM path), 5,
  'Annual SMART Visa Check-In and Renewal',
  'SMART Visa holders must complete an annual check-in via the BOI SMART Visa portal and maintain their qualifying conditions (employment, salary, health insurance) to keep the visa active.',
  'Failing to maintain qualifying conditions — such as leaving your BOI-sponsored employer or letting your health insurance lapse — can result in SMART Visa cancellation, converting your status to a standard tourist or overstay situation.',
  'Ongoing (annual check-in)',
  ARRAY[]::text[],
  ARRAY['https://smart-visa.boi.go.th/smart/', 'https://www.immigration.go.th/'],
  ARRAY['Annual check-in is done online via the BOI portal — no in-person immigration visit required for reporting.', 'If you change employers, notify the BOI promptly. Your new employer must also hold BOI promotion status.', 'Renewal: if your SMART Visa was issued for less than 4 years, you can renew. A new endorsement from the agency is typically required.', 'Keep records of your salary slips and health insurance renewal letters — these may be requested during check-in.']
);


-- ============================================================
-- Path: non_b_self_employed (6 steps)
-- ============================================================
WITH path AS (SELECT 'non_b_self_employed'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Choose Your Company Structure',
  'Foreigners wishing to work for their own company in Thailand must establish a legal entity first. The most common structure is a Thai Limited Company (บริษัทจำกัด), which requires at least 51% Thai shareholder ownership for most business types. BOI promotion can provide an alternative for eligible businesses.',
  'Your chosen company structure determines your tax obligations, your ability to own land, how many Thai employees you need, and whether you qualify for BOI incentives. Getting this wrong is expensive to fix.',
  '1–2 weeks (research + legal consultation)',
  ARRAY[]::text[],
  ARRAY['https://www.dbd.go.th/en/', 'https://www.boi.go.th/en/index/'],
  ARRAY['Thai Limited Company: minimum 3 shareholders required, at least 51% Thai ownership for most regulated businesses. You as a foreigner can hold up to 49%.', 'BOI-promoted company: can be 100% foreign-owned if operating in a targeted industry. Requires BOI application and approval before incorporation.', 'Foreign Business License (FBL): an alternative path to 100% foreign ownership without BOI, but approval is slow and discretionary.', 'Strongly recommended: consult a Thai corporate lawyer or reputable legal firm before deciding. Company setup mistakes are costly to unwind.']
),
(
  (SELECT path_id FROM path), 2,
  'Register Your Company with the Department of Business Development (DBD)',
  'File your company''s memorandum of association and articles of incorporation with the DBD. This officially creates your legal entity and gives you a company registration number.',
  'Without DBD registration, your company does not legally exist. You cannot open a corporate bank account, register for tax, or apply for a work permit without this registration.',
  '3–7 business days (after all documents are prepared)',
  ARRAY['Memorandum of association (หนังสือบริคณห์สนธิ)', 'List of shareholders and their nationalities', 'Director identification documents (passport for foreign directors)', 'Registered office address in Thailand', 'Statement of paid-up capital (minimum THB 2 million for companies employing foreigners)', 'DBD registration fee payment'],
  ARRAY['https://www.dbd.go.th/en/', 'https://ereg.dbd.go.th/'],
  ARRAY['Minimum registered capital to employ a foreign national: THB 2 million per work permit holder (standard rule).', 'DBD registration can now be done online via the e-Registration portal — you do not need to visit a DBD office in person for initial registration.', 'Your company''s registered office must be a real physical address in Thailand. A virtual office service is acceptable for registration purposes.', 'Once registered, apply for your company''s tax ID (เลขประจำตัวผู้เสียภาษี) with the Revenue Department within 60 days.']
),
(
  (SELECT path_id FROM path), 3,
  'Apply for a Non-Immigrant B (Business) Visa',
  'With your company registration documents in hand, apply for a Non-B visa at a Thai consulate or embassy abroad. You will use your own company''s documents as your "employer" supporting materials.',
  'You cannot legally work for your company — even as its owner/director — without first having a valid Non-B visa. Entering on a tourist visa or visa exemption and then working is a criminal offence.',
  '3–10 business days at consulate',
  ARRAY['Passport (valid 18+ months)', 'Company registration certificate (from DBD)', 'Company affidavit (certified, dated within 3 months)', 'Letter of invitation on company letterhead (signed by you as director)', 'Bank statement showing company funds (THB 2 million+ registered capital)', 'Passport-size photos'],
  ARRAY['https://consular.mfa.go.th/', 'https://www.mfa.go.th/en/'],
  ARRAY['As the company director, you write the invitation letter to yourself — this is normal and accepted by consulates.', 'Apply in your home country or a country where you have residency for the smoothest experience.', 'The Non-B is typically issued as a 90-day single-entry visa. Apply for the work permit before it expires.', 'Some consulates require the company''s VAT registration (ภพ.20) in addition to DBD documents — call ahead to confirm requirements.']
),
(
  (SELECT path_id FROM path), 4,
  'Apply for Your Work Permit as Company Director',
  'Submit a work permit application at the Department of Employment (DoE). As a company director, your company sponsors your own work permit — you are both the employer and the employee for this purpose.',
  'The work permit legally authorizes you to perform the specific job role listed (e.g. "Managing Director") for your company. Operating without one, even as the company owner, carries fines up to THB 100,000 and possible deportation.',
  '5–7 business days after submission',
  ARRAY['Passport with valid Non-B visa', 'Company registration certificate and affidavit', 'Balance sheet and audited financial statements', 'List of Thai employees (with social security registration proof)', 'Map and photos of company office', 'Three 1-inch passport photos', 'Medical certificate from a Thai clinic (dated within 30 days)', 'Your educational qualifications'],
  ARRAY['https://www.doe.go.th/'],
  ARRAY['The 4:1 ratio rule applies: your company must employ at least 4 Thai nationals for each foreign work permit holder. Plan your hiring accordingly.', 'Thai employees must be registered with Social Security (SSO) — the DoE will verify this during work permit review.', 'The paid-up capital of THB 2 million per work permit must be reflected in your company''s bank account and balance sheet at the time of application.', 'For the first work permit application, you will typically need to appear in person at the DoE. Renewals can sometimes be delegated.']
),
(
  (SELECT path_id FROM path), 5,
  'Register for Corporate and Personal Taxes',
  'Register your company for Corporate Income Tax (CIT) and VAT with the Revenue Department. Also register yourself for Personal Income Tax (PIT) as a salary-earning director.',
  'Tax compliance is mandatory. Unregistered companies face penalties and potential criminal liability for directors. Paying yourself a salary (even minimum) from the company is also required to demonstrate you are genuinely employed.',
  '1–2 weeks',
  ARRAY['Company registration certificate', 'Director''s passport and work permit', 'Proof of company office address', 'Bank account details'],
  ARRAY['https://www.rd.go.th/english/'],
  ARRAY['VAT registration is required once your company''s annual revenue exceeds THB 1.8 million — you can voluntarily register earlier.', 'Pay yourself a salary of at least the minimum wage for your work permit category. This salary is your basis for personal income tax.', 'Corporate income tax rate: 20% of net profit. SMEs with revenue under THB 30 million have a reduced tiered rate.', 'Annual financial statements must be audited by a Thai-licensed CPA and filed with the DBD within 5 months of your fiscal year end.']
),
(
  (SELECT path_id FROM path), 6,
  'Set Up Annual Renewal and Compliance Calendar',
  'As a self-employed company director, you are responsible for both corporate compliance deadlines and your personal immigration renewals. These are separate calendars that must both be maintained.',
  'Missing a corporate filing deadline can result in company suspension. Missing an immigration deadline can result in overstay fines or work permit invalidation. Unlike an employed expat, no HR department manages this for you.',
  'Ongoing',
  ARRAY[]::text[],
  ARRAY['https://www.dbd.go.th/en/', 'https://www.rd.go.th/english/', 'https://www.doe.go.th/', 'https://www.immigration.go.th/'],
  ARRAY['Immigration: renew your Non-B visa (border run or consulate) and work permit annually. Start work permit renewal 30–45 days before expiry.', 'Corporate: annual financial statement audit, DBD filing (within 5 months of fiscal year end), annual shareholder meeting.', 'Tax: monthly VAT returns (if registered), personal income tax return (by March 31), corporate tax return (by May 31 for December year-end companies).', 'Consider engaging a local accounting firm for monthly bookkeeping and compliance — the cost is worth the peace of mind.']
);


-- ============================================================
-- Path: digital_nomad_grey (5 steps)
-- ============================================================
WITH path AS (SELECT 'digital_nomad_grey'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Understand the Legal Reality of Working Remotely in Thailand',
  'Thailand does not have a dedicated digital nomad visa. Working remotely for a foreign employer while in Thailand on a tourist visa or visa exemption is technically illegal under the Alien Working Act B.E. 2551. However, enforcement against remote workers working for overseas companies is rare and largely unenforced as of 2026.',
  'Knowing the legal landscape lets you make an informed risk decision rather than operating in ignorance. The risk is real even if low — immigration officers can and do deny entry to repeat border runners, and the law has been enforced in isolated cases.',
  '1–2 days (reading + reflection)',
  ARRAY[]::text[],
  ARRAY['https://www.immigration.go.th/', 'https://ltr.boi.go.th/'],
  ARRAY['The Alien Working Act B.E. 2551 (2008) prohibits any work in Thailand without a valid work permit, regardless of who pays you or where your employer is located.', 'In practice, Thai immigration does not actively monitor remote workers — enforcement focus is on those taking jobs from Thai nationals in Thai businesses.', 'This guide helps you minimize risk while you decide on a long-term path. It is NOT a legal authorization to work. For a clean legal status, see the LTR Visa path.', 'If your work requires you to meet Thai clients or attend business meetings in Thailand, your risk profile increases significantly.']
),
(
  (SELECT path_id FROM path), 2,
  'Choose Your Entry Strategy: Visa Exempt, TR, or METV',
  'You have three main short-stay options: (1) Visa Exemption — 60 days for most Western nationalities by air (no visa required); (2) Tourist Visa (TR) — 60 days, extendable to 90 days at immigration; (3) Multiple Entry Tourist Visa (METV) — 60 days per entry, valid for 6 months.',
  'Each option has different costs, hassle levels, and sustainability. Understanding them helps you pick the right tool for your current stay length and plan your exit before you overstay.',
  '1 day (research)',
  ARRAY[]::text[],
  ARRAY['https://www.mfa.go.th/en/', 'https://consular.mfa.go.th/'],
  ARRAY['Visa Exempt (60 days): simplest for most Western nationalities. Free. Extendable once for 30 more days at a local immigration office (THB 1,900 fee).', 'Tourist Visa (TR): apply at a Thai consulate before arrival. Valid for 60 days, extendable for 30 more days. Best if you want 90 days before needing to leave.', 'METV: apply at a Thai consulate. Costs USD 200+ depending on your nationality. Allows multiple entries over 6 months, 60 days each. Best if you plan to travel in/out of the region frequently.', 'Overstaying even by one day results in a THB 500/day fine and can cause issues at future border crossings. Always know your visa expiry date.']
),
(
  (SELECT path_id FROM path), 3,
  'Extend Your Stay at a Local Immigration Office',
  'If you entered on a visa exemption or tourist visa, you can extend your stay by up to 30 days at any Thai immigration office before your current permission expires. This is a straightforward in-person process.',
  'Extensions buy you time without needing to leave the country. It is the simplest legal way to stay longer than your initial entry stamp allows.',
  'Half a day (in-person visit)',
  ARRAY['Passport', 'TM.7 extension application form (available at immigration office)', 'One passport-size photo', 'THB 1,900 fee (cash)'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['Arrive early — immigration offices open at 8:30am and queues build quickly. Chiang Mai, Phuket, and Pattaya offices tend to be faster than Bangkok''s Chaeng Wattana.', 'Bangkok main office: Government Complex, Chaeng Wattana Road — be prepared for a full-day wait.', 'You can only extend once per entry. After that, you must leave Thailand and re-enter.', 'Dress respectfully when visiting government offices — shorts and flip-flops can result in being turned away.']
),
(
  (SELECT path_id FROM path), 4,
  'Plan Your Border Run (and Know When It Becomes a Problem)',
  'A "border run" means leaving Thailand briefly and re-entering to get a fresh entry stamp. It resets your permitted stay. While legal in principle, immigration officers at major land crossings can and do refuse re-entry to people who appear to be living in Thailand on repeated tourist entries.',
  'Relying on border runs indefinitely is not a stable long-term strategy. Immigration has the right to deny entry to anyone, and repeated border crossings as a resident pattern raises red flags.',
  '1 day (border run trip)',
  ARRAY['Passport', 'Proof of onward travel (flight ticket or hotel booking)', 'Proof of funds (bank statement showing sufficient money)', 'Return transport booked'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['Land border crossings (e.g. Mae Sai, Aranyaprathet, Nong Khai) are increasingly scrutinized for visa-run tourists. Airport re-entries are generally less questioned.', 'Common signs that trigger extra questioning: many recent Thai stamps, no return flight booked, unable to show proof of accommodation or funds.', 'If asked your purpose of visit, "tourism" is your genuine answer — avoid mentioning work, even remote work.', 'If you''ve done 3+ consecutive land border runs, consider flying out to a neighboring country (e.g. Chiang Mai → Chiang Rai → Vientiane by air) for a more convincing break.']
),
(
  (SELECT path_id FROM path), 5,
  'Plan Your Upgrade to a Legal Long-Term Visa',
  'The grey-area approach is a temporary measure, not a lifestyle. If you plan to base yourself in Thailand longer-term, the LTR Visa (Work-from-Thailand Professional category) is now the correct legal path. It is designed exactly for your situation.',
  'Every month you spend in grey-area status is a month you are accumulating risk without accumulating legal status. The LTR Visa provides 10-year legal residency, annual 90-day reporting, no work permit needed, and peace of mind.',
  '4–8 weeks (LTR application process)',
  ARRAY[]::text[],
  ARRAY['https://ltr.boi.go.th/', 'https://smart-visa.boi.go.th/smart/'],
  ARRAY['LTR Work-from-Thailand Professional: requires USD 80,000 annual income from an overseas employer (or USD 40,000 with qualifying skills/degree). Health insurance required.', 'SMART Visa (Category T or E): if your employer is a BOI-promoted company or you meet the skill criteria.', 'Set yourself a deadline: if you have been in Thailand on tourist entries for 6+ months, prioritize the LTR application now.', 'The LTR application can be submitted while you are in Thailand on a tourist entry — you do not need to leave to apply.']
);


-- ============================================================
-- Path: border_run_strategy (4 steps)
-- ============================================================
WITH path AS (SELECT 'border_run_strategy'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Understand Your Current Entry Stamp and Expiry Date',
  'Your Thai entry stamp shows two things: the date you entered, and the date you must depart by ("Permitted to Stay Until"). These are different for different nationalities and visa types. Know your exact deadline.',
  'Overstaying your permitted stay — even by one day — results in a fine of THB 500 per day and can trigger a ban from re-entering Thailand (up to 10 years for serious overstays). Never guess your expiry date.',
  '30 minutes (check your passport)',
  ARRAY['Your passport (check the entry stamp pages)'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['Your entry stamp says "Permitted to Stay Until [DATE]" — this is your hard deadline, not 30 or 60 days from your memory of arrival.', 'Visa Exempt entry: most Western nationalities now receive 60 days by air (updated 2024). Some nationalities still receive 30 days. Land entries may differ.', 'Tourist Visa (TR) holders: 60 days from date of entry.', 'If you are unsure, visit any immigration office and ask — they will tell you without penalty.']
),
(
  (SELECT path_id FROM path), 2,
  'Extend Your Stay at a Local Immigration Office (First Option)',
  'Before planning a border run, exhaust the in-country option: a 30-day extension is available at any Thai immigration office for THB 1,900. This is easier, cheaper, and safer than crossing a border.',
  'A border run involves real cost, time, and risk of refusal. The in-country extension is guaranteed as long as your current entry is valid and you apply before expiry.',
  'Half a day',
  ARRAY['Passport', 'TM.7 application form (available at immigration)', 'One passport-size photo', 'THB 1,900 cash'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['You can only extend once per entry. If you have already extended once this entry, you must leave Thailand.', 'Major immigration offices: Bangkok (Chaeng Wattana), Chiang Mai (Promenada), Phuket (Phuket Town), Pattaya (Jomtien).', 'Arrive before 8:30am to secure a queue number. Afternoon arrivals at busy offices may be turned away.', 'Bring exact change or be prepared to queue separately at a cash machine inside some offices.']
),
(
  (SELECT path_id FROM path), 3,
  'Execute a Border Run — Land or Air',
  'Leave Thailand, clear Thai exit immigration, cross into a neighboring country briefly, and re-enter Thailand to receive a new entry stamp. The most common land crossing points are with Malaysia, Laos, Cambodia, and Myanmar.',
  'A successful border run resets your permitted stay, buying you time to pursue a longer-term visa solution. It is legally valid, but immigration officers can refuse re-entry at their discretion.',
  '1 day (land) or 2–3 days (air, more reliable)',
  ARRAY['Passport (must have blank pages for new stamps)', 'Proof of sufficient funds (THB 20,000 per person recommended)', 'Return ticket or onward travel evidence', 'Hotel booking confirmation'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['Popular land crossings: Sadao/Dannok (Hat Yai → Malaysia), Nong Khai (→ Laos), Aranyaprathet (→ Cambodia), Mae Sai (→ Myanmar).', 'Air border runs: fly from Bangkok or Chiang Mai to a nearby country (Kuala Lumpur, Singapore, Vientiane), stay 1–2 nights, fly back. More expensive but less scrutinized at airport re-entry.', 'Have a clear, confident answer for "purpose of visit" — tourism. Avoid mentioning work or that you live in Thailand.', 'Repeated land-border-only runs (same crossing, same week) are increasingly likely to result in questioning or refusal. Vary your crossings.']
),
(
  (SELECT path_id FROM path), 4,
  'Transition to a Long-Term Visa Before This Strategy Fails',
  'The border run / extension approach is explicitly a short-term bridge. Thai immigration has been tightening scrutiny of serial tourist-entry residents. Use the time you are buying to get your paperwork in order for a proper long-term status.',
  'Thai immigration can refuse entry at any time, for any reason, without recourse. If your income and work situation qualify you for the LTR Visa or SMART Visa, being refused re-entry while in legal grey-area status means losing your life in Thailand with no warning.',
  '4–8 weeks (while still in Thailand)',
  ARRAY[]::text[],
  ARRAY['https://ltr.boi.go.th/', 'https://smart-visa.boi.go.th/smart/', 'https://www.immigration.go.th/'],
  ARRAY['LTR Visa (Work-from-Thailand Professional): best option for remote workers earning USD 80,000+/year. 10-year visa, no work permit, annual reporting.', 'Non-B + Work Permit: if you have a Thai employer willing to sponsor you, this is the standard employed path.', 'Non-B Self-Employed: if you want to set up your own company and work legally in Thailand.', 'Every border run you do is a risk that could go wrong. Set a hard deadline — "if I have not applied for my LTR by [date], I will start the application that day." Do not keep extending the timeline.']
);


-- ============================================================
-- Path: non_o_dependent (5 steps)
-- ============================================================
WITH path AS (SELECT 'non_o_dependent'::text AS path_id)
INSERT INTO steps (path_id, order_index, title, description, why_it_matters, estimated_time, required_documents, official_links, tips) VALUES
(
  (SELECT path_id FROM path), 1,
  'Gather and Certify Your Marriage and Identity Documents',
  'The Non-Immigrant O visa for spouses of Thai nationals requires proof of your legal marriage recognized by Thailand. This means your marriage certificate must be registered with a Thai Amphoe (district office) or certified through the Thai embassy if you married abroad.',
  'Thailand requires Thai-registered marriage documentation. A marriage certificate from your home country alone is not sufficient — it must be translated, notarized, and accepted by Thai authorities, or the marriage must be re-registered at a Thai district office.',
  '1–4 weeks (depending on document source country)',
  ARRAY['Marriage certificate (Thai Amphoe registration preferred)', 'If married abroad: certified copy of foreign marriage certificate + Thai-certified translation', 'Your passport (valid 18+ months)', 'Your spouse''s Thai national ID card (บัตรประชาชน)', 'Your spouse''s Thai household registration document (ทะเบียนบ้าน)', 'Your passport-size photos (2)'],
  ARRAY['https://www.dopa.go.th/', 'https://consular.mfa.go.th/'],
  ARRAY['If you married in Thailand: ensure your marriage is registered at an Amphoe (district office) — a religious ceremony alone is not legally recognized.', 'If you married abroad: obtain an apostilled copy of your marriage certificate and have it officially translated into Thai by a certified translator.', 'Your Thai spouse''s ทะเบียนบ้าน must be current and show their current address — outdated documents cause delays.', 'Some immigration offices also ask for relationship photos as evidence of a genuine marriage — bring a selection if you have them.']
),
(
  (SELECT path_id FROM path), 2,
  'Apply for a Non-Immigrant O Visa',
  'Apply for the Non-Immigrant O (Other) visa at a Thai embassy or consulate in your home country, or at a Thai consulate in a neighboring country. This is the entry visa that allows you to enter Thailand and subsequently apply for a 1-year extension based on your marriage.',
  'You cannot apply for the 1-year marriage extension from inside Thailand without first holding a valid Non-O visa or converting from another visa category. Starting with the correct visa saves you from having to do a border run later.',
  '3–10 business days at consulate',
  ARRAY['Passport', 'Thai marriage certificate (or certified foreign marriage certificate + translation)', 'Thai spouse''s ID card and ทะเบียนบ้าน', 'Passport-size photos', 'Bank statement (some consulates require proof of funds)'],
  ARRAY['https://consular.mfa.go.th/', 'https://www.mfa.go.th/en/'],
  ARRAY['The Non-O visa is issued as a single-entry 90-day visa. You will convert it to a 1-year extension after arriving in Thailand.', 'If you are already in Thailand on a tourist visa or visa exemption, you can sometimes convert to a Non-O at the Chaeng Wattana immigration office in Bangkok — ask about "in-country conversion" when you arrive.', 'Some consulates are stricter than others. The Thai consulate in Penang (Malaysia) and Vientiane (Laos) are commonly used by expats for smooth processing.']
),
(
  (SELECT path_id FROM path), 3,
  'Enter Thailand and Register Your Address (TM.30)',
  'Within 24 hours of arriving at your Thai residence (not just entering Thailand), your landlord or property owner must file a TM.30 report with immigration to notify them of your address. If staying with your Thai spouse, they must file this.',
  'Immigration requires all foreigners to be registered at a known address. Without a TM.30 on file, your extension application at the local immigration office may be delayed or rejected.',
  '1–2 days after arrival',
  ARRAY['Your passport', 'Rental agreement or proof of residence', 'Property owner''s ID (your spouse''s Thai ID if living at their home)'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['TM.30 is the landlord''s responsibility, but in practice most expats manage this themselves — it can be done online at the immigration e-service portal or in person at the local immigration office.', 'If you move address, a new TM.30 must be filed within 24 hours of moving. Keep track of this.', 'Hotels and serviced apartments file TM.30 automatically — if staying there temporarily, you do not need to do anything.']
),
(
  (SELECT path_id FROM path), 4,
  'Apply for a 1-Year Extension of Stay Based on Marriage',
  'Before your Non-O visa''s 90-day permission expires, visit your local immigration office to apply for a 1-year extension of stay. This annual extension is renewable each year you remain married and meet the financial requirements.',
  'The 1-year extension transforms your 90-day entry visa into an annual residency status. Without renewing it each year, you will overstay your permitted stay.',
  '1–2 days at immigration office',
  ARRAY['Passport with valid Non-O visa stamp', 'TM.7 extension application form', 'Thai marriage certificate', 'Thai spouse''s ID card and ทะเบียนบ้าน', 'Proof of financial requirements (see tips)', 'Map to your home address', 'Photos of your home interior and of you with your Thai spouse', 'Two passport-size photos', 'THB 1,900 application fee'],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['Financial requirement: you must show either (a) THB 400,000 in a Thai bank account (deposited at least 2 months before application and maintained), OR (b) a monthly income of at least THB 40,000 transferred from abroad, OR (c) a combination totaling THB 400,000 annually.', 'The THB 400,000 must be in YOUR Thai bank account, not your spouse''s. Open a Thai bank account early (see bank account opening step).', 'Photos of your home are typically requested: exterior of the building, main living areas, and photos of you and your spouse together at home.', 'Immigration officers may conduct a home visit to verify the marriage is genuine — this is more common in some provinces than others.']
),
(
  (SELECT path_id FROM path), 5,
  '90-Day Reporting and Annual Renewal',
  'While on a 1-year extension, you must report your address to immigration every 90 days (90-day reporting). You must also renew the 1-year extension annually before it expires.',
  'Missing 90-day reporting results in a fine of THB 2,000 per occurrence. Failing to renew before your extension expires means you are overstaying — fines of THB 500/day apply immediately.',
  'Ongoing',
  ARRAY[]::text[],
  ARRAY['https://www.immigration.go.th/'],
  ARRAY['90-day reporting can be done: (1) in person at any immigration office, (2) by mail (send TM.47 form and passport copies), or (3) online via the Immigration Bureau''s online reporting system.', 'Set a calendar reminder 2 weeks before your 90-day deadline — do not wait until the last day in case of office closures.', 'Annual renewal: start gathering financial documents (bank statements, income proof) 6–8 weeks before your extension expires.', 'Re-entry permit: if you travel abroad while on a 1-year extension, you need a re-entry permit (THB 1,000 single, THB 3,800 multiple) stamped in your passport before you leave — otherwise your extension is cancelled upon exit.']
);
