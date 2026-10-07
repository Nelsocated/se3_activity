/* =====================================================================
   SE 2123 - Module 4 Activity: CPU PRINT HUB (Part B - C Memory Bug Hunt)
   STARTER FILE - rename to LastNameFirstInitial_PrintHub.c
   Compile: gcc LastNameFirstInitial_PrintHub.c -o printhub
   Run:     ./printhub        (Windows: printhub.exe)
   Name: Lago, Nelson III & Tingson, Reinwel   Section: BSSE 2
   ===================================================================== */

/* =====================================================================
   PROVIDED: Memory tracker – DO NOT EDIT
   Counts every malloc/free, catches double frees, and "poisons" freed
   memory so that reading it afterwards shows an obviously wrong number.
   ===================================================================== */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_BLOCKS 64
static void  *blocks[MAX_BLOCKS];
static size_t sizes[MAX_BLOCKS];
static int    freed[MAX_BLOCKS];
static int    n_blocks = 0, n_allocs = 0, n_frees = 0, n_bad_frees = 0;

static void *track_malloc(size_t size) {
    void *p = malloc(size);
    if (p != NULL && n_blocks < MAX_BLOCKS) {
        blocks[n_blocks] = p; sizes[n_blocks] = size; freed[n_blocks] = 0;
        n_blocks++; n_allocs++;
    }
    return p;
}

static void track_free(void *p) {
    int i;
    /* free(NULL) is always safe */
    if (p == NULL) return;                       
    for (i = 0; i < n_blocks; i++) {
        if (blocks[i] == p && !freed[i]) {
            /* poison the released memory */
            memset(p, 0xDD, sizes[i]);           
            freed[i] = 1; n_frees++;
            /* real free happens at exit */
            return;                              
        }
    }
    n_bad_frees++;
    printf("  !! DOUBLE FREE / INVALID FREE detected\n");
}

static void memory_report(void) {
    int i, leaked = 0;
    for (i = 0; i < n_blocks; i++) {
        if (!freed[i]) leaked++;
        free(blocks[i]);
    }
    printf("--- MEMORY CHECK ---\n");
    printf("Allocations: %d | Frees: %d | Leaked blocks: %d | Double frees: %d\n",
           n_allocs, n_frees, leaked, n_bad_frees);
    printf("RESULT: %s\n", (leaked == 0 && n_bad_frees == 0) ? "CLEAN" : "PROBLEMS FOUND");
}

#define malloc(size) track_malloc(size)
#define free(ptr)    track_free(ptr)
/* ======================= END OF PROVIDED TRACKER ===================== */

#define JOBS 5

/* ======================= START OF YOUR CODE ======================= */
/* This function has THREE memory bugs. Find them, fix them, and mark
   each fix with a comment:  // FIX 1 (memory leak): ...               */
void run_print_hub(void) {
    /* ALLOCATE: page counts of today's print jobs (same queue as Part A) */
    int *pages = malloc(JOBS * sizeof(int));
    int *total = malloc(sizeof(int));
    char *summary = malloc(64 * sizeof(char));
    int i;

    int today[JOBS] = {12, 25, 0, 5, 20};

    /* check that every malloc worked (free(NULL) is safe, so cleanup is easy) */
    if (pages == NULL || total == NULL || summary == NULL) {
        printf("Out of memory\n");
        free(pages);
        free(total);
        free(summary);
        return;
    }

    /* USE */
    *total = 0;
    for (i = 0; i < JOBS; i++) {
        pages[i] = today[i];
        *total += pages[i];
    }
    sprintf(summary, "%d jobs, %d pages", JOBS, *total);

    /* RELEASE */
    // FIX 2 (dangling pointer / use-after-free): print BEFORE freeing total
    printf("Total pages: %d\n", *total);
    printf("Summary: %s\n", summary);

    free(total);
    total = NULL;

    // FIX 1 (memory leak): summary was never freed, so free it now
    free(summary);
    summary = NULL;

    // FIX 3 (double free): pages was freed twice, now it is freed only once
    free(pages);
    pages = NULL;
}
/* ======================== END OF YOUR CODE ======================== */

int main(void) {
    printf("=== PRINT HUB (C) ===\n");
    run_print_hub();
    memory_report();
    return 0;
}