import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, PlusCircle, Trash2 } from 'lucide-react';

const BillBreakdownCalculator = () => {
  const [participants, setParticipants] = useState([
    { id: 1, name: '', amount: '' }
  ]);
  const [calculations, setCalculations] = useState([]);
  const [paymentInstructions, setPaymentInstructions] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A52A2A'];

  useEffect(() => {
    calculateBreakdown();
  }, [participants]);

  const addParticipant = () => {
    setParticipants([...participants, { id: participants.length + 1, name: '', amount: '' }]);
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const updateParticipant = (id, field, value) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : p
    ));
  };

  const calculateBreakdown = () => {
    const totalAmount = participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const equalSharePerPerson = totalAmount / participants.length;

    const calculatedParticipants = participants.map((p, index) => {
      const paid = parseFloat(p.amount) || 0;
      const balance = paid - equalSharePerPerson;
      return {
        ...p,
        paid,
        equalShare: equalSharePerPerson,
        balance,
        color: colors[index % colors.length]
      };
    });

    setCalculations(calculatedParticipants);

    // Calculate payment instructions
    const payingParticipants = calculatedParticipants.filter(p => p.balance < 0);
    const receivingParticipants = calculatedParticipants.filter(p => p.balance > 0);
    const instructions = [];

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

  const handlePieClick = (_, index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Interactive Bill Breakdown Calculator</h2>
      
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-xl font-semibold">Add Participants</h3>
        </CardHeader>
        <CardContent>
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Name"
                value={participant.name}
                onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                className="flex-grow"
              />
              <Input
                type="number"
                placeholder="Amount Paid"
                value={participant.amount}
                onChange={(e) => updateParticipant(participant.id, 'amount', e.target.value)}
                className="w-32"
              />
              {participants.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeParticipant(participant.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button onClick={addParticipant} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Participant
          </Button>
        </CardContent>
      </Card>

      {calculations.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Payment Distribution</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={calculations}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="paid"
                      onClick={handlePieClick}
                    >
                      {calculations.map((entry, index) => (
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
                <h3 className="text-xl font-semibold">Breakdown Summary</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {calculations.map((participant, index) => (
                    <li key={index} className={`p-2 rounded ${activeIndex === index ? 'bg-gray-100' : ''}`}>
                      <strong style={{ color: participant.color }}>{participant.name}</strong>: Paid ${participant.paid.toFixed(2)}
                      <br />
                      <span className={participant.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {participant.balance > 0 ? `Receives $${participant.balance.toFixed(2)}` :
                         participant.balance < 0 ? `Pays $${Math.abs(participant.balance).toFixed(2)}` :
                         `Receives $0.00`}
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

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Payment Instructions</h3>
                <Button
                  onClick={() => setShowExplanation(!showExplanation)}
                  variant="outline"
                  size="sm"
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
                    <strong style={{ color: calculations.find(c => c.name === instruction.from).color }}>{instruction.from}</strong>
                    {' should pay '}
                    <strong style={{ color: calculations.find(c => c.name === instruction.to).color }}>{instruction.to}</strong>
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
                    <li>If the amount paid exactly matches the equal share, they will receive $0.00.</li>
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