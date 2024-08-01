import BillBreakdownCalculator from '@/components/BillBreakdownCalculator'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <BillBreakdownCalculator />
    </main>
  )
}