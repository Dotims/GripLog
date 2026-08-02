import type { Exercise } from "./types";

export async function fetchExercises(): Promise<Exercise[]> {
    const response = await fetch ("https://oss.exercisedb.dev/api/v1/exercises?limit=25");
    if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data as Exercise[];
}

export async function fetchExerciseById(id: string): Promise<Exercise> {
    const response = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch exercise with ID ${id}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.data as Exercise;
}