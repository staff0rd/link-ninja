import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid2 as Grid,
  Paper,
  TextField,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import { enAU } from "date-fns/locale";
import { useAtom, useAtomValue } from "jotai";
import { omit } from "lodash";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import {
  defaultFormState,
  FormData,
  formSchema,
  formStateAtom,
  tagsAtom,
} from "./atoms";

const repoPath = REPO_PATH;
const githubPat = GITHUB_PAT;

export default function Form() {
  const [defaultValues, setDefaultValues] = useAtom(formStateAtom);
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timestamp: new Date(),
      ...omit(defaultValues, ["timestamp"]),
    },
  });

  // Watch content field for live preview
  const content = watch("content");

  // Get available tags from the atom
  const availableTags = useAtomValue(tagsAtom);
  const [inputValue, setInputValue] = useState("");
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filter tags based on input
  const filteredOptions = useMemo(() => {
    if (!Array.isArray(availableTags)) return [];
    return inputValue === ""
      ? availableTags
      : availableTags.filter((tag) =>
          tag.toLowerCase().includes(inputValue.toLowerCase())
        );
  }, [availableTags, inputValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitStatus(null);
    try {
      // Get GitHub PAT and repo info from storage
      const [owner, repo, path] = repoPath.split("/");

      if (!githubPat || !repoPath) {
        throw new Error("GitHub configuration not found");
      }
      // Format date for filename
      const date = format(data.timestamp, "yyyy-MM-dd");
      const filename = `${date}-${data.slug}.md`;

      // Format content
      const content = `---
date: ${format(data.timestamp, "yyyy-MM-dd'T'HH:mm:ssXXX")}
tags: [${data.tags.join(", ")}]
---

${data.content}`;

      // Get current content to get SHA (if file exists)
      let sha: string | undefined;
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${filename}`,
          {
            headers: {
              Authorization: `Bearer ${githubPat}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const fileData = await response.json();
          sha = fileData.sha;
        }
      } catch {
        console.log("File doesn't exist yet, creating new one");
      }

      // Create/update file in GitHub
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}/${filename}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubPat}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Add ${filename}`,
            content: btoa(unescape(encodeURIComponent(content))),
            ...(sha ? { sha } : {}),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      setSubmitStatus({
        type: "success",
        message: `Successfully saved ${filename} to GitHub`,
      });

      // Clear form on success
      handleClear();
    } catch (error) {
      console.error("Failed to submit:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      throw error;
    }
  };

  const handleClear = () => {
    setDefaultValues(defaultFormState);
    reset(defaultFormState);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ maxWidth: 1024, mt: "10vh" }}
      >
        <Grid container spacing={2}>
          <Grid size={12}>
            {submitStatus && (
              <Alert
                severity={submitStatus.type}
                onClose={() => setSubmitStatus(null)}
              >
                {submitStatus.message}
              </Alert>
            )}
          </Grid>
          <Grid size={6}>
            <Controller
              name="timestamp"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  sx={{ minWidth: 16 }}
                  {...field}
                  label="Date & Time"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.timestamp,
                      helperText: errors.timestamp?.message,
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={6}>
            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setDefaultValues((prev) => {
                      const newValue = { ...prev, slug: e.target.value };
                      return newValue;
                    });
                  }}
                  label="Slug"
                  fullWidth
                  error={!!errors.slug}
                  helperText={errors.slug?.message ?? " "}
                />
              )}
            />
          </Grid>
          <Grid size={12}>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  freeSolo
                  options={filteredOptions}
                  value={field.value}
                  inputValue={inputValue}
                  onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue);
                  }}
                  onChange={(_, newValue) => {
                    field.onChange(newValue);
                    setDefaultValues((prev) => {
                      return {
                        ...prev,
                        tags: newValue,
                      };
                    });
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={index}
                        label={option}
                        onDelete={() => {
                          const newTags = [...field.value];
                          newTags.splice(index, 1);
                          field.onChange(newTags);
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Add tags"
                      error={!!errors.tags}
                      helperText={errors.tags?.message ?? " "}
                      slotProps={{
                        formHelperText: {
                          sx: { minHeight: 3 },
                        },
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid size={12}>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setDefaultValues((prev) => {
                      return {
                        ...prev,
                        content: e.target.value,
                      };
                    });
                  }}
                  label="Content (Markdown)"
                  multiline
                  rows={8}
                  fullWidth
                  error={!!errors.content}
                  helperText={errors.content?.message ?? " "}
                  placeholder="Write your content in markdown format..."
                />
              )}
            />
          </Grid>

          <Grid size={12}>
            <Paper
              sx={{
                p: 2,
                height: "100%",
                maxHeight: "calc(8 * 1.5rem + 2rem)", // Match textarea height
                overflow: "auto",
              }}
            >
              <Box
                sx={{
                  textAlign: "left",
                  "& blockquote": {
                    borderLeft: "4px solid #ccc",
                    margin: 0,
                    paddingLeft: 1,
                  },
                  "& p": {
                    marginBlockStart: 0,
                    marginBlockEnd: 0,
                  },
                }}
              >
                <ReactMarkdown>{content || "*No content yet*"}</ReactMarkdown>
              </Box>
            </Paper>
          </Grid>

          <Grid size={6}>
            <Button type="submit" variant="contained" fullWidth>
              Submit
            </Button>
          </Grid>
          <Grid size={6}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={handleClear}
            >
              Clear Form
            </Button>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
