import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { TopHeader } from '@/components/layout';
import { ROUTES } from '@/lib/client/routes';

export default async function HomePage(): Promise<React.JSX.Element> {
  const t = await getTranslations('landingPage');

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Header ── */}
      <TopHeader />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-100 via-transparent to-green-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-40 left-10 w-3 h-3 rounded-full bg-purple-400 opacity-40" />
          <div className="absolute top-60 right-20 w-2 h-2 rounded-full bg-green-400 opacity-50" />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 rounded-full bg-purple-300 opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {t('hero.badge')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                {t('hero.title1')}
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-green-500 bg-clip-text text-transparent">
                  {t('hero.title2')}
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href={ROUTES.ADMIN_REGISTER}
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-purple-600 to-green-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all"
                >
                  {t('hero.ctaStart')}
                  <ArrowRightIcon />
                </Link>
                <Link
                  href={ROUTES.WORKER_LOGIN}
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  {t('hero.ctaWorkerLogin')}
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircleIcon />
                  {t('hero.noCreditCard')}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircleIcon />
                  {t('hero.instantSetup')}
                </span>
              </div>
            </div>

            {/* Right: Dashboard mock */}
            <div className="mt-12 lg:mt-0 flex justify-center">
              <DashboardMock
                workTimeLabel={t('preview.workTime')}
                thisMonthLabel={t('preview.thisMonthApplications')}
                xrpBalanceLabel={t('preview.xrpBalance')}
                monthlyWorkLabel={t('preview.monthlyWorkHours')}
                workingLabel={t('preview.working')}
                applyingLabel={t('preview.applying')}
                approvedLabel={t('preview.approved')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-gray-400">
            <span className="font-medium text-gray-500 shrink-0">{t('features.poweredBy')}</span>
            <span className="flex items-center gap-2 text-gray-600 font-semibold">
              <XrpLedgerMark />
              {t('features.xrpLedger')}
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-gray-500">{t('features.encryption')}</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-gray-500">{t('features.realTimeRate')}</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase mb-2">{t('howItWorks.title')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold">{t('howItWorks.subtitle')}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (lg only) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-purple-200 via-purple-300 to-green-300" />

            <StepCard step={1} title={t('howItWorks.step1.title')} description={t('howItWorks.step1.description')} color="purple" />
            <StepCard step={2} title={t('howItWorks.step2.title')} description={t('howItWorks.step2.description')} color="purple" />
            <StepCard step={3} title={t('howItWorks.step3.title')} description={t('howItWorks.step3.description')} color="green" />
            <StepCard step={4} title={t('howItWorks.step4.title')} description={t('howItWorks.step4.description')} color="green" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase mb-2">{t('featuresSection.title')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold">{t('featuresSection.subtitle')}</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              {t('featuresSection.description')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title={t('featuresSection.realTimeClock.title')}
              description={t('featuresSection.realTimeClock.description')}
              icon={<ClockIcon />}
            />
            <FeatureCard
              title={t('featuresSection.flexibleApplication.title')}
              description={t('featuresSection.flexibleApplication.description')}
              icon={<DocumentIcon />}
            />
            <FeatureCard
              title={t('featuresSection.instantXrpTransfer.title')}
              description={t('featuresSection.instantXrpTransfer.description')}
              icon={<CurrencyIcon />}
            />
            <FeatureCard
              title={t('featuresSection.onChainRecord.title')}
              description={t('featuresSection.onChainRecord.description')}
              icon={<ShieldIcon />}
            />
            <FeatureCard
              title={t('featuresSection.globalTransfer.title')}
              description={t('featuresSection.globalTransfer.description')}
              icon={<GlobeIcon />}
            />
            <FeatureCard
              title={t('featuresSection.dashboardManagement.title')}
              description={t('featuresSection.dashboardManagement.description')}
              icon={<ChartIcon />}
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <StatItem value={t('stats.clockTimeValue')} label={t('stats.clockTime')} />
            <StatItem value={t('stats.paymentAvailabilityValue')} label={t('stats.paymentAvailability')} />
            <StatItem value={t('stats.xrpSpeedValue')} label={t('stats.xrpSpeed')} />
            <StatItem value={t('stats.setupCostValue')} label={t('stats.setupCost')} />
          </div>
        </div>
      </section>

      {/* ── For Admin / For Worker ── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Admin */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase mb-2">{t('forAdmins.title')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">{t('forAdmins.subtitle')}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('forAdmins.description')}
              </p>
              <ul className="space-y-3">
                <BulletItem text={t('forAdmins.feature1')} />
                <BulletItem text={t('forAdmins.feature2')} />
                <BulletItem text={t('forAdmins.feature3')} />
                <BulletItem text={t('forAdmins.feature4')} />
              </ul>
              <Link
                href={ROUTES.ADMIN_REGISTER}
                className="inline-flex items-center gap-1 mt-6 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                {t('forAdmins.cta')}
                <ArrowRightIcon />
              </Link>
            </div>
            <div className="mt-10 lg:mt-0">
              <AdminPanelMock
                dashboardLabel={t('preview.adminDashboard')}
                applicationsLabel={t('preview.applicationList')}
                workersLabel={t('preview.workerManagement')}
                paymentsLabel={t('preview.payments')}
                approveLabel={t('preview.approve')}
              />
            </div>
          </div>

          {/* Worker */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 mt-10 lg:mt-0">
              <WorkerPanelMock
                dashboardLabel={t('preview.workerDashboard')}
                workingLabel={t('preview.working')}
                restLabel={t('preview.rest')}
                endLabel={t('preview.end')}
                recentLabel={t('preview.recentApplications')}
                approvedLabel={t('preview.approved')}
                paidLabel={t('preview.paid')}
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-green-600 tracking-wide uppercase mb-2">{t('forWorkers.title')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">{t('forWorkers.subtitle')}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('forWorkers.description')}
              </p>
              <ul className="space-y-3">
                <BulletItem text={t('forWorkers.feature1')} color="green" />
                <BulletItem text={t('forWorkers.feature2')} color="green" />
                <BulletItem text={t('forWorkers.feature3')} color="green" />
                <BulletItem text={t('forWorkers.feature4')} color="green" />
              </ul>
              <Link
                href={ROUTES.WORKER_LOGIN}
                className="inline-flex items-center gap-1 mt-6 text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                {t('forWorkers.cta')}
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-green-600" />
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative px-8 py-14 sm:px-14 sm:py-20 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {t('cta.title1')}
                <br className="hidden sm:inline" />
                {t('cta.title2')}
              </h2>
              <p className="mt-4 text-purple-100 text-base sm:text-lg max-w-xl mx-auto">
                {t('cta.description')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={ROUTES.ADMIN_REGISTER}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-purple-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg"
                >
                  {t('cta.ctaStart')}
                  <ArrowRightIcon />
                </Link>
                <Link
                  href={ROUTES.WORKER_LOGIN}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  {t('cta.ctaWorkerLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                Seneca
              </span>
              <p className="mt-3 text-sm leading-relaxed max-w-sm">
                {t('hero.subtitle')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href={ROUTES.ADMIN_LOGIN} className="hover:text-gray-200 transition-colors">
                    {t('footer.adminLogin')}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.WORKER_LOGIN} className="hover:text-gray-200 transition-colors">
                    {t('footer.workerLogin')}
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ADMIN_REGISTER} className="hover:text-gray-200 transition-colors">
                    {t('footer.register')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><span className="cursor-default">{t('footer.contact')}</span></li>
                <li><span className="cursor-default">{t('footer.terms')}</span></li>
                <li><span className="cursor-default">{t('footer.privacy')}</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span>&copy; 2026 {t('footer.copyright')}</span>
            <span>{t('footer.poweredBy')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================
   Sub-components
   ================================================================ */

/* ── Step Card ── */
function StepCard({ step, title, description, color }: {
  step: number;
  title: string;
  description: string;
  color: 'purple' | 'green';
}): React.JSX.Element {
  const bgColor = color === 'purple' ? 'bg-purple-600' : 'bg-green-600';
  return (
    <div className="relative text-center">
      <div className={`mx-auto w-10 h-10 rounded-full ${bgColor} text-white text-sm font-bold flex items-center justify-center shadow-md relative z-10`}>
        {step}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ title, description, icon }: {
  title: string;
  description: string;
  icon: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-100 transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-green-500 flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ── Stat Item ── */
function StatItem({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-green-500 bg-clip-text text-transparent">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

/* ── Bullet Item ── */
function BulletItem({ text, color = 'purple' }: { text: string; color?: 'purple' | 'green' }): React.JSX.Element {
  const dotColor = color === 'purple' ? 'bg-purple-500' : 'bg-green-500';
  return (
    <li className="flex items-start gap-3 text-gray-600 text-sm">
      <span className={`mt-1.5 w-2 h-2 rounded-full ${dotColor} shrink-0`} />
      {text}
    </li>
  );
}

/* ================================================================
   Mock UI panels (CSS-only product visualization)
   ================================================================ */

function DashboardMock({
  workTimeLabel,
  thisMonthLabel,
  xrpBalanceLabel,
  monthlyWorkLabel,
  workingLabel,
  applyingLabel,
  approvedLabel,
}: {
  workTimeLabel: string;
  thisMonthLabel: string;
  xrpBalanceLabel: string;
  monthlyWorkLabel: string;
  workingLabel: string;
  applyingLabel: string;
  approvedLabel: string;
}): React.JSX.Element {
  return (
    <div className="animate-float w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-purple-100/50 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-gray-400">Senecahboard</span>
        </div>
        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <MockStatCard label={workTimeLabel} value="6h 32m" accent="purple" />
            <MockStatCard label={thisMonthLabel} value="¥184,200" accent="green" />
            <MockStatCard label={xrpBalanceLabel} value="412.8" accent="purple" />
          </div>
          {/* Chart placeholder */}
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-end gap-1.5 h-20">
              {[40, 65, 50, 80, 70, 90, 55, 75, 60, 85, 72, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-purple-500 to-green-400 opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{monthlyWorkLabel}</p>
          </div>
          {/* Row items */}
          <div className="space-y-2">
            <MockRow label="Tanaka Taro" status={workingLabel} statusColor="green" />
            <MockRow label="Sato Hanako" status={applyingLabel} statusColor="yellow" />
            <MockRow label="Suzuki Ichiro" status={approvedLabel} statusColor="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockStatCard({ label, value, accent }: {
  label: string;
  value: string;
  accent: 'purple' | 'green';
}): React.JSX.Element {
  const border = accent === 'purple' ? 'border-purple-100' : 'border-green-100';
  const valueColor = accent === 'purple' ? 'text-purple-700' : 'text-green-700';
  return (
    <div className={`rounded-lg border ${border} bg-white p-2.5`}>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-sm font-bold ${valueColor} mt-0.5`}>{value}</p>
    </div>
  );
}

function MockRow({ label, status, statusColor }: {
  label: string;
  status: string;
  statusColor: 'green' | 'yellow' | 'purple';
}): React.JSX.Element {
  const badgeStyles: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-200" />
        <span className="text-xs text-gray-700 font-medium">{label}</span>
      </div>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeStyles[statusColor]}`}>
        {status}
      </span>
    </div>
  );
}

function AdminPanelMock({
  dashboardLabel,
  applicationsLabel,
  workersLabel,
  paymentsLabel,
  approveLabel,
}: {
  dashboardLabel: string;
  applicationsLabel: string;
  workersLabel: string;
  paymentsLabel: string;
  approveLabel: string;
}): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-purple-100/30 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-gray-400">{dashboardLabel}</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">{applicationsLabel}</span>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">{workersLabel}</span>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">{paymentsLabel}</span>
        </div>
        {[
          { name: 'Tanaka Taro', amount: '¥45,600', date: '2026/01/28' },
          { name: 'Sato Hanako', amount: '¥62,400', date: '2026/01/27' },
          { name: 'Suzuki Ichiro', amount: '¥38,200', date: '2026/01/26' },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-100" />
              <div>
                <p className="text-xs font-medium text-gray-800">{item.name}</p>
                <p className="text-[10px] text-gray-400">{item.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">{item.amount}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">{approveLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkerPanelMock({
  dashboardLabel,
  workingLabel,
  restLabel,
  endLabel,
  recentLabel,
  approvedLabel,
  paidLabel,
}: {
  dashboardLabel: string;
  workingLabel: string;
  restLabel: string;
  endLabel: string;
  recentLabel: string;
  approvedLabel: string;
  paidLabel: string;
}): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-green-100/30 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-gray-400">{dashboardLabel}</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Timer */}
        <div className="text-center rounded-xl bg-gradient-to-br from-green-50 to-purple-50 p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{workingLabel}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 font-mono tracking-wider">03:24:18</p>
          <div className="mt-3 flex gap-2 justify-center">
            <span className="px-4 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-medium">{restLabel}</span>
            <span className="px-4 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-medium">{endLabel}</span>
          </div>
        </div>
        {/* Recent */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">{recentLabel}</p>
          {[
            { period: '1/20 - 1/26', amount: '¥62,400', status: approvedLabel, color: 'text-green-600 bg-green-50' },
            { period: '1/13 - 1/19', amount: '¥58,100', status: paidLabel, color: 'text-purple-600 bg-purple-50' },
          ].map((a) => (
            <div key={a.period} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-xs text-gray-700 font-medium">{a.period}</p>
                <p className="text-[10px] text-gray-400">{a.amount}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.color}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SVG Icons
   ================================================================ */

function ArrowRightIcon(): React.JSX.Element {
  return (
    <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function CheckCircleIcon(): React.JSX.Element {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XrpLedgerMark(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
      <path d="M8 8l3 3m5-3l-3 3m-2 0l-3 3m5-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-600" />
    </svg>
  );
}

function ClockIcon(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  );
}

function DocumentIcon(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CurrencyIcon(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );
}

function ShieldIcon(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function GlobeIcon(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon(): React.JSX.Element {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm6 10h2v8h-2z" />
    </svg>
  );
}
