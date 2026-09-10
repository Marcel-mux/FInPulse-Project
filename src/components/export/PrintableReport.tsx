"use client";

import { Account, AnalyticsSummary, TransactionWithRelations } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface PrintableReportProps {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  summary: AnalyticsSummary;
  totalNetWorth: number;
  periodLabel: string;
}

export function PrintableReport({
  transactions,
  accounts,
  summary,
  totalNetWorth,
  periodLabel,
}: PrintableReportProps) {
  const printDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      id="finpulse-printable-report"
      className="hidden print:block p-8 bg-white text-gray-900 font-sans"
    >
      {/* Document Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
              FinPulse
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-900 text-white font-bold">
              PRO
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">
            Laporan Analitik & Ringkasan Keuangan Pribadi
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>
            <span className="font-semibold text-gray-700">Waktu Cetak:</span>{" "}
            {printDate}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Periode:</span>{" "}
            {periodLabel}
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-[11px] font-semibold text-gray-600 uppercase block">
            Total Saldo Bersih
          </span>
          <span className="text-base font-black text-gray-900">
            {formatCurrency(totalNetWorth)}
          </span>
        </div>

        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
            Total Pemasukan
          </span>
          <span className="text-base font-black text-emerald-700">
            {formatCurrency(summary.totalIncome)}
          </span>
        </div>

        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-[11px] font-semibold text-rose-800 uppercase block">
            Total Pengeluaran
          </span>
          <span className="text-base font-black text-rose-700">
            {formatCurrency(summary.totalExpense)}
          </span>
        </div>

        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-[11px] font-semibold text-gray-600 uppercase block">
            Arus Kas Bersih
          </span>
          <span
            className={`text-base font-black ${
              summary.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {summary.netCashFlow >= 0 ? "+" : ""}
            {formatCurrency(summary.netCashFlow)}
          </span>
        </div>
      </div>

      {/* Accounts Breakdown Table */}
      <div className="mb-8 break-inside-avoid">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          1. Status Rekening & Dompet ({accounts.length} Akun)
        </h2>
        <table className="w-full text-left text-xs border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="py-2 px-3 font-bold text-gray-700 border-r border-gray-300 w-12">
                No
              </th>
              <th className="py-2 px-3 font-bold text-gray-700 border-r border-gray-300">
                Nama Akun / Dompet
              </th>
              <th className="py-2 px-3 font-bold text-gray-700 border-r border-gray-300">
                Tipe
              </th>
              <th className="py-2 px-3 font-bold text-gray-700 text-right">
                Saldo Terkini
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, idx) => (
              <tr
                key={acc.id}
                className="border-b border-gray-200 odd:bg-white even:bg-gray-50"
              >
                <td className="py-2 px-3 border-r border-gray-300 text-center">
                  {idx + 1}
                </td>
                <td className="py-2 px-3 border-r border-gray-300 font-semibold text-gray-900">
                  {acc.name}
                </td>
                <td className="py-2 px-3 border-r border-gray-300 capitalize text-gray-600">
                  {acc.type}
                </td>
                <td className="py-2 px-3 text-right font-bold text-gray-900 tabular-nums">
                  {formatCurrency(acc.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transactions Details Table */}
      <div className="break-inside-avoid">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          2. Rincian Transaksi ({transactions.length} Transaksi)
        </h2>
        <table className="w-full text-left text-xs border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="py-2 px-2.5 font-bold text-gray-700 border-r border-gray-300 w-10 text-center">
                No
              </th>
              <th className="py-2 px-2.5 font-bold text-gray-700 border-r border-gray-300 w-24">
                Tanggal
              </th>
              <th className="py-2 px-2.5 font-bold text-gray-700 border-r border-gray-300 w-24">
                Tipe
              </th>
              <th className="py-2 px-2.5 font-bold text-gray-700 border-r border-gray-300">
                Keterangan
              </th>
              <th className="py-2 px-2.5 font-bold text-gray-700 border-r border-gray-300 w-28">
                Kategori
              </th>
              <th className="py-2 px-2.5 font-bold text-gray-700 border-r border-gray-300 w-28">
                Akun
              </th>
              <th className="py-2 px-2.5 font-bold text-gray-700 text-right w-28">
                Nominal
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-center text-gray-500 italic"
                >
                  Tidak ada transaksi pada periode ini.
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => {
                const isIncome = tx.type === "income";
                const isTransfer = tx.type === "transfer";
                const prefix = isIncome ? "+" : isTransfer ? "⇄" : "-";
                const amountClass = isIncome
                  ? "text-emerald-700"
                  : isTransfer
                  ? "text-indigo-700"
                  : "text-rose-700";

                const txDate = new Date(tx.date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-200 odd:bg-white even:bg-gray-50"
                  >
                    <td className="py-1.5 px-2.5 border-r border-gray-300 text-center">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-gray-300 whitespace-nowrap">
                      {txDate}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-gray-300 capitalize font-medium">
                      {tx.type === "income"
                        ? "Pemasukan"
                        : tx.type === "expense"
                        ? "Pengeluaran"
                        : "Transfer"}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-gray-300">
                      <span className="font-medium text-gray-900 block truncate max-w-[200px]">
                        {tx.description || tx.category?.name || "Transaksi"}
                      </span>
                      {tx.tags && (
                        <span className="text-[10px] text-gray-500">
                          {tx.tags}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-gray-300 text-gray-600">
                      {tx.category?.name ||
                        (isTransfer ? "Transfer Antar Akun" : "-")}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-gray-300 text-gray-600">
                      {tx.account.name}
                      {tx.toAccount && ` → ${tx.toAccount.name}`}
                    </td>
                    <td
                      className={`py-1.5 px-2.5 text-right font-bold tabular-nums whitespace-nowrap ${amountClass}`}
                    >
                      {prefix} {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Signature & Notes */}
      <div className="mt-10 pt-4 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-500 break-inside-avoid">
        <span>Dicetak secara otomatis dari FinPulse PRO.</span>
        <span>Halaman 1 dari 1</span>
      </div>
    </div>
  );
}
