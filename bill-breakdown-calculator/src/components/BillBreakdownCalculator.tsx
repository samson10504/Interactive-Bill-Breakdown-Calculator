"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieProps } from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, PlusCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Participant {
  id: number;
  name: string;
  amount: string;
}

interface CalculatedParticipant extends Participant {
  paid: number;
  equalShare: number;
  balance: number;
  color: string;
}

interface PaymentInstruction {
  from: string;
  to: string;
  amount: number;
}

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

const BillBreakdownCalculator: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: '', amount: '' }
  ]);
  const [calculations, setCalculations] = useState<CalculatedParticipant[]>([]);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstruction[]>([]);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const colors = useMemo(() => ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A52A2A'], []);

  useEffect(() => {
    calculateBreakdown();
  }, [participants]);

  const addParticipant = () => {
    setParticipants(prev => [...prev, { id: prev.length + 1, name: '', amount: '' }]);
  };

  const removeParticipant = (id: number) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const updateParticipant = (id: number, field: 'name' | 'amount', value: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: field === 'amount' ? (value === '' ? '' : parseFloat(value) || 0) : value } : p
    ));
  };

  const calculateBreakdown = () => {
    setError('');
    if (participants.some(p => !p.name || p.amount === '')) {
      setError('Please fill in all participant details before calculating.');
      setCalculations([]);
      setPaymentInstructions([]);
      return;
    }

    const totalAmount = participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const participantsCount = participants.length;
    const equalSharePerPerson = totalAmount / participantsCount;

    const calculatedParticipants: CalculatedParticipant[] = participants.map((p, index) => ({
      ...p,
      paid: parseFloat(p.amount) || 0,
      equalShare: equalSharePerPerson,
      balance: (parseFloat(p.amount) || 0) - equalSharePerPerson,
      color: colors[index % colors.length]
    }));

    setCalculations(calculatedParticipants);
  
    // Create deep copies for payment calculations
    const payingParticipants = JSON.parse(JSON.stringify(calculatedParticipants.filter(p => p.balance < 0))) as CalculatedParticipant[];
    const receivingParticipants = JSON.parse(JSON.stringify(calculatedParticipants.filter(p => p.balance > 0))) as CalculatedParticipant[];
    const instructions: PaymentInstruction[] = [];

    payingParticipants.forEach(payer => {
      let remainingToPay = Math.abs(payer.balance);
      receivingParticipants.forEach(receiver => {
        if (remainingToPay > 0 && receiver.balance > 0) {
          const amount = Math.min(remainingToPay, receiver.balance);
          instructions.push({
            from: payer.name,
            to: receiver.name,
            amount: Number(amount.toFixed(2))
          });
          remainingToPay -= amount;
          receiver.balance -= amount;
        }
      });
    });

    setPaymentInstructions(instructions);
  };

  const handlePieClick: PieProps['onClick'] = (_, index) => {
    setActiveIndex(prev => prev === index ? null : index);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomizedLabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Interactive Bill Breakdown Calculator</h2>
      
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <h3 className="text-lg sm:text-xl font-semibold">Add Participants</h3>
        </CardHeader>
        <CardContent>
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
              <Input
                placeholder="Name"
                value={participant.name}
                onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                className="w-full sm:w-auto flex-grow"
              />
              <div className="flex w-full sm:w-auto items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Amount Paid"
                  value={participant.amount}
                  onChange={(e) => updateParticipant(participant.id, 'amount', e.target.value)}
                  className="flex-grow"
                  min="0"
                  step="0.01"
                />
                {participants.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeParticipant(participant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button onClick={addParticipant} className="mt-2 w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Participant
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4 sm:mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {calculations.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg sm:text-xl font-semibold">Payment Distribution</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={calculations.filter(c => c.paid > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="paid"
                      onClick={handlePieClick}
                    >
                      {calculations.filter(c => c.paid > 0).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          opacity={activeIndex === index ? 0.8 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center mt-4 text-sm text-gray-600">
                  Click on a slice to highlight. Total amount: ${calculations.reduce((sum, c) => sum + c.paid, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg sm:text-xl font-semibold">Breakdown Summary</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {calculations.map((participant, index) => (
                    <li key={index} className={`p-2 rounded ${activeIndex === index ? 'bg-gray-100' : ''}`}>
                      <strong style={{ color: participant.color }}>{participant.name}</strong>: Paid ${participant.paid.toFixed(2)}
                      <br />
                      <span className={participant.balance > 0 ? 'text-green-600' : participant.balance < 0 ? 'text-red-600' : 'text-gray-600'}>
                        {participant.balance > 0 ? `Receives $${participant.balance.toFixed(2)}` :
                         participant.balance < 0 ? `Owes $${Math.abs(participant.balance).toFixed(2)}` :
                         `Balanced`}
                      </span>
                      <br />
                      <span className="text-sm text-gray-600">
                        (Equal share: ${participant.equalShare.toFixed(2)})
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4 sm:mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-semibold">Payment Instructions</h3>
                <Button
                  onClick={() => setShowExplanation(!showExplanation)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Info className="mr-2 h-4 w-4" />
                  {showExplanation ? 'Hide' : 'Show'} Explanation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {paymentInstructions.map((instruction, index) => (
                  <li key={index}>
                    <strong style={{ color: calculations.find(c => c.name === instruction.from)?.color }}>{instruction.from}</strong>
                    {' should pay '}
                    <strong style={{ color: calculations.find(c => c.name === instruction.to)?.color }}>{instruction.to}</strong>
                    {' $'}{instruction.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
              
              {showExplanation && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h4 className="font-semibold mb-2">Explanation of Calculations:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Total amount spent: ${calculations.reduce((sum, c) => sum + c.paid, 0).toFixed(2)}</li>
                    <li>Equal share per person: ${calculations[0].equalShare.toFixed(2)}</li>
                    <li>We calculate how much each person overpaid or underpaid compared to their equal share.</li>
                    <li>Those who paid more than their equal share will receive money, while those who paid less will need to pay.</li>
                    <li>Participants who paid $0 will need to pay their full equal share.</li>
                    <li>We then distribute the payments to balance everything out, minimizing the number of transactions needed.</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BillBreakdownCalculator;