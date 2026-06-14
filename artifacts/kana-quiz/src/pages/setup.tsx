import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useQuizContext } from "@/store/quiz-context";

const setupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  discord: z.string().optional(),
  mode: z.enum(["hiragana", "katakana", "mixed"]),
  quizMode: z.enum(["multiple-choice", "typing"]),
  questionCount: z.enum(["10", "25", "50", "all"])
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function Setup() {
  const [, setLocation] = useLocation();
  const { setSettings, resetQuiz } = useQuizContext();

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
      discord: "",
      mode: "hiragana",
      quizMode: "multiple-choice",
      questionCount: "25",
    },
  });

  const onSubmit = (data: SetupFormValues) => {
    resetQuiz();
    setSettings({
      ...data,
      questionCount: data.questionCount === "all" ? "all" : parseInt(data.questionCount, 10),
    });
    setLocation("/quiz");
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Configure Practice</h1>
          <p className="text-muted-foreground">Set up your study session.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border/50 shadow-sm bg-card/50">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium border-b pb-2">Student Info</h2>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Taro Yamada" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discord"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="username#1234" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card/50">
              <CardContent className="p-6 space-y-8">
                <div>
                  <h2 className="text-lg font-medium border-b pb-2 mb-4">Study Material</h2>
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="hiragana" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">Hiragana Only</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="katakana" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">Katakana Only</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="mixed" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">Mixed (Both)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-medium border-b pb-2 mb-4">Question Type</h2>
                  <FormField
                    control={form.control}
                    name="quizMode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="multiple-choice" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">Multiple Choice</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="typing" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">Typing</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-medium border-b pb-2 mb-4">Length</h2>
                  <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="10" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">10</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="25" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">25</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="50" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">50</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="all" /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">All</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="w-full sm:w-auto px-8">
                Start Practice
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </MainLayout>
  );
}
