import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TimerConfig } from '@/hooks/useAnnouncementTimers';

interface TimerEditDialogProps {
  timer: TimerConfig;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<TimerConfig>) => void;
}

const TimerEditDialog: React.FC<TimerEditDialogProps> = ({
  timer,
  open,
  onClose,
  onSave,
}) => {
  const [intervalMinutes, setIntervalMinutes] = useState(timer.intervalMinutes);
  const [messages, setMessages] = useState(timer.messages);

  const handleAddMessage = () => {
    setMessages([...messages, '']);
  };

  const handleRemoveMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleUpdateMessage = (index: number, value: string) => {
    const newMessages = [...messages];
    newMessages[index] = value;
    setMessages(newMessages);
  };

  const handleSave = () => {
    onSave({
      intervalMinutes,
      messages: messages.filter(m => m.trim() !== ''),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>{timer.icon}</span>
            Editar {timer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="interval">Intervalo (minutos)</Label>
            <Input
              id="interval"
              type="number"
              min={1}
              max={60}
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Mensagens</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddMessage}
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={message}
                    onChange={(e) => handleUpdateMessage(index, e.target.value)}
                    placeholder={`Mensagem ${index + 1}...`}
                    className="min-h-[60px] flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveMessage(index)}
                    disabled={messages.length <= 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gradient-energy">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimerEditDialog;
