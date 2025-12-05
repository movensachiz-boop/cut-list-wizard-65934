import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator as CalcIcon, X } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  if (!isOpen) return null;

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = 0;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result = 0;

    switch (operation) {
      case '+':
        result = previousValue + inputValue;
        break;
      case '-':
        result = previousValue - inputValue;
        break;
      case '×':
        result = previousValue * inputValue;
        break;
      case '÷':
        result = inputValue !== 0 ? previousValue / inputValue : 0;
        break;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const buttonClass = "h-12 text-lg font-semibold";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 shadow-xl border-2 border-primary/20">
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between bg-primary/10">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalcIcon className="h-4 w-4" />
            Calculator
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3">
          <div className="bg-muted rounded-md p-3 mb-3 text-right">
            <div className="text-xs text-muted-foreground h-4">
              {previousValue !== null && operation ? `${previousValue} ${operation}` : ''}
            </div>
            <div className="text-2xl font-mono font-bold truncate">{display}</div>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5">
            <Button variant="secondary" className={buttonClass} onClick={clear}>C</Button>
            <Button variant="secondary" className={buttonClass} onClick={toggleSign}>±</Button>
            <Button variant="secondary" className={buttonClass} onClick={percentage}>%</Button>
            <Button variant="accent" className={`${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90`} onClick={() => performOperation('÷')}>÷</Button>
            
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('7')}>7</Button>
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('8')}>8</Button>
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('9')}>9</Button>
            <Button variant="accent" className={`${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90`} onClick={() => performOperation('×')}>×</Button>
            
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('4')}>4</Button>
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('5')}>5</Button>
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('6')}>6</Button>
            <Button variant="accent" className={`${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90`} onClick={() => performOperation('-')}>−</Button>
            
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('1')}>1</Button>
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('2')}>2</Button>
            <Button variant="outline" className={buttonClass} onClick={() => inputDigit('3')}>3</Button>
            <Button variant="accent" className={`${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90`} onClick={() => performOperation('+')}>+</Button>
            
            <Button variant="outline" className={`${buttonClass} col-span-2`} onClick={() => inputDigit('0')}>0</Button>
            <Button variant="outline" className={buttonClass} onClick={inputDecimal}>.</Button>
            <Button className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`} onClick={calculate}>=</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
