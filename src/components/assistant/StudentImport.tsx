import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface StudentImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRTL: boolean;
}

interface ParsedStudent {
  full_name: string;
  email: string;
  phone?: string;
  academic_year?: string;
  language_track?: string;
  password?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const StudentImport: React.FC<StudentImportProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isRTL,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setParseError(isRTL ? 'يرجى اختيار ملف CSV' : 'Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setResult(null);
    parseCSV(selectedFile);
  };

  const parseCSV = async (csvFile: File) => {
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setParseError(isRTL ? 'الملف فارغ أو لا يحتوي على بيانات' : 'File is empty or has no data');
        return;
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = header.findIndex(h => h.includes('name') || h.includes('اسم'));
      const emailIndex = header.findIndex(h => h.includes('email') || h.includes('بريد'));
      const phoneIndex = header.findIndex(h => h.includes('phone') || h.includes('هاتف'));
      const yearIndex = header.findIndex(h => h.includes('year') || h.includes('سنة') || h.includes('academic'));
      const trackIndex = header.findIndex(h => h.includes('track') || h.includes('لغة') || h.includes('language'));
      const passwordIndex = header.findIndex(h => h.includes('password') || h.includes('كلمة'));

      if (nameIndex === -1 || emailIndex === -1) {
        setParseError(isRTL 
          ? 'الملف يجب أن يحتوي على عمود للاسم والبريد الإلكتروني' 
          : 'File must contain name and email columns'
        );
        return;
      }

      const students: ParsedStudent[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > emailIndex && values[emailIndex]?.trim()) {
          students.push({
            full_name: values[nameIndex]?.trim() || '',
            email: values[emailIndex]?.trim() || '',
            phone: phoneIndex !== -1 ? values[phoneIndex]?.trim() : undefined,
            academic_year: yearIndex !== -1 ? values[yearIndex]?.trim() : undefined,
            language_track: trackIndex !== -1 ? values[trackIndex]?.trim() : undefined,
            password: passwordIndex !== -1 ? values[passwordIndex]?.trim() : undefined,
          });
        }
      }

      if (students.length === 0) {
        setParseError(isRTL ? 'لم يتم العثور على طلاب صالحين' : 'No valid students found');
        return;
      }

      if (students.length > 150) {
        setParseError(isRTL 
          ? `الحد الأقصى 150 طالب. الملف يحتوي على ${students.length} طالب` 
          : `Maximum 150 students allowed. File contains ${students.length} students`
        );
        return;
      }

      setParsedStudents(students);
    } catch (error) {
      console.error('Parse error:', error);
      setParseError(isRTL ? 'خطأ في قراءة الملف' : 'Error reading file');
    }
  };

  // Handle CSV values with quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleImport = async () => {
    if (parsedStudents.length === 0) return;

    setImporting(true);
    setProgress(0);
    
    const results: ImportResult = { success: 0, failed: 0, errors: [] };
    const createdAccounts: { email: string; password: string; name: string }[] = [];

    for (let i = 0; i < parsedStudents.length; i++) {
      const student = parsedStudents[i];
      const password = student.password || generatePassword();

      try {
        // Create user via admin API (edge function)
        const { data, error } = await supabase.functions.invoke('import-student', {
          body: {
            email: student.email,
            password: password,
            full_name: student.full_name,
            phone: student.phone,
            academic_year: student.academic_year,
            language_track: student.language_track,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        results.success++;
        createdAccounts.push({
          email: student.email,
          password: password,
          name: student.full_name,
        });
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${student.email}: ${error.message || 'Unknown error'}`);
      }

      setProgress(Math.round(((i + 1) / parsedStudents.length) * 100));
    }

    setResult(results);
    setImporting(false);

    if (results.success > 0) {
      // Download credentials file
      downloadCredentials(createdAccounts);
      
      toast({
        title: isRTL ? 'تم الاستيراد' : 'Import Complete',
        description: isRTL 
          ? `تم إضافة ${results.success} طالب بنجاح` 
          : `Successfully added ${results.success} students`,
      });
      onSuccess();
    }
  };

  const downloadCredentials = (accounts: { email: string; password: string; name: string }[]) => {
    const csvContent = [
      'Name,Email,Temporary Password',
      ...accounts.map(a => `"${a.name}","${a.email}","${a.password}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = 'full_name,email,phone,academic_year,language_track\nأحمد محمد,ahmed@example.com,01234567890,second_secondary,arabic\nSara Ali,sara@example.com,01234567891,third_secondary,languages';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setParsedStudents([]);
    setResult(null);
    setParseError(null);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isRTL ? 'استيراد الطلاب' : 'Import Students'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? 'استيراد الطلاب من ملف CSV (الحد الأقصى 150 طالب)' 
              : 'Import students from a CSV file (max 150 students)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template download */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadTemplate}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {isRTL ? 'تحميل نموذج CSV' : 'Download CSV Template'}
          </Button>

          {/* File upload */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            {file ? (
              <p className="text-sm text-foreground font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'اضغط لاختيار ملف CSV' : 'Click to select CSV file'}
              </p>
            )}
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {parseError}
            </div>
          )}

          {/* Parsed students preview */}
          {parsedStudents.length > 0 && !result && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-foreground mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {isRTL 
                  ? `تم العثور على ${parsedStudents.length} طالب` 
                  : `Found ${parsedStudents.length} students`}
              </div>
              <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                {parsedStudents.slice(0, 5).map((s, i) => (
                  <div key={i}>{s.full_name} ({s.email})</div>
                ))}
                {parsedStudents.length > 5 && (
                  <div className="text-muted-foreground">
                    {isRTL 
                      ? `و ${parsedStudents.length - 5} آخرين...` 
                      : `and ${parsedStudents.length - 5} more...`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import progress */}
          {importing && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {isRTL ? 'جاري الاستيراد...' : 'Importing...'}
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">{progress}%</div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">
                  ✓ {isRTL ? `نجح: ${result.success}` : `Success: ${result.success}`}
                </span>
                {result.failed > 0 && (
                  <span className="text-destructive">
                    ✗ {isRTL ? `فشل: ${result.failed}` : `Failed: ${result.failed}`}
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}
              {result.success > 0 && (
                <div className="text-xs text-muted-foreground">
                  {isRTL 
                    ? 'تم تحميل ملف بيانات الدخول المؤقتة' 
                    : 'Credentials file downloaded automatically'}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {isRTL ? 'إغلاق' : 'Close'}
          </Button>
          {parsedStudents.length > 0 && !result && (
            <Button onClick={handleImport} disabled={importing}>
              {importing 
                ? (isRTL ? 'جاري الاستيراد...' : 'Importing...') 
                : (isRTL ? 'استيراد الطلاب' : 'Import Students')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
