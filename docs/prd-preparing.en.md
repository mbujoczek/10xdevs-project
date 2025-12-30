<conversation_summary>

<decisions>

1.  The main target audience for the product is students.
2.  The application will use a ready-made open-source library to handle the repetition algorithm (preliminarily assumed to be SuperMemo.NET).
3.  The flashcard generation process involves the AI creating several "candidates," which the user reviews in a single session. Decisions (acceptance, editing, rejection) are saved to the database only after clicking the "Finish Review" button.
4.  The success criterion (75% acceptance) will be measured as the ratio of flashcards accepted without edits to all generated flashcard candidates across the entire system.
5.  The application and flashcard generation will support English (default) and Polish.
6.  The character limit for the input text for flashcard generation is 10,000.
7.  The user account system will be based exclusively on a login and password with JWT authentication. There will be no third-party logins, email verification, or a "forgot password" feature in the MVP.
8.  There will be no "deck" system in the MVP. All of a user's flashcards will be on a single list, without pagination or filtering to start.
9.  The AI model for generating flashcards must be free.
10. The study session interface will be based on a 6-point grading scale (0-5) consistent with the SuperMemo (SM-2) algorithm.
11. Flashcards edited by the user will be counted as "edited" (not "accepted") for metrics purposes but will be available in study mode just like "accepted" flashcards.

</decisions>

<matched_recommendations>

1.  Defining the user persona (students) to guide UX design and communication.
2.  Creating a dedicated "review" process where the user verifies generated flashcards before they are finally saved.
3.  Precisely defining the "acceptance" metric as the action of clicking the "Accept" button without prior editing of the flashcard.
4.  Implementing a simple authentication system based on login/password and JWT, with a minimal dataset (`userId`) in the payload.
5.  Adding a simple language switcher in the user interface, with the choice saved in the browser.
6.  Differentiating between "accepted" and "edited" flashcards in the metrics to more accurately measure the quality of the AI model.
7.  Designing the study session interface to match the requirements of the chosen SRS library (SM-2 rating scale).

</matched_recommendations>

<prd_planning_summary>

Based on the discussion, the PRD for the MVP should focus on the following elements:

a. Main functional requirements of the product:

User System: Registration and login using a login and password. JWT-based authentication. No password reset or email verification features.
Flashcard Generation: The user pastes text (up to 10,000 characters) in Polish or English. The system, using a free AI model, generates a list of flashcard "candidates."
Flashcard Review: The user navigates to a dedicated review view where for each candidate, they can choose one of three options: Accept, Edit, Reject. Changes are saved to the database in bulk after the review is finished.
Flashcard Management: All accepted and edited user flashcards are displayed on a single list.
Studying: The system integrates with an open-source library (e.g., SuperMemo.NET) to handle repetitions. The study session interface allows the user to rate their answer on a 6-point scale (0-5).
Multilingualism: The application interface is available in Polish and English, with the ability to switch between them.

b. Key user stories and usage paths:

Flashcard Generation Path: As a student, I want to paste a fragment of my lecture notes so that the system automatically generates flashcard proposals for me. Then I want to quickly review them, accept the good ones, correct those that need improvement, and reject the weak ones, and finally save them all to my account.
Study Path: As a student, I want to start a study session during which the system will present flashcards to me according to the spaced repetition algorithm. After seeing the answer, I want to rate how well I knew it so the algorithm can schedule the next repetition.
Flashcard Management Path: As a student, I want to be able to review all my flashcards - questions and answers.

c. Important success criteria and how to measure them:

AI Acceptance Rate: At least 75% of AI-generated flashcards are accepted by users without editing. Measured globally as (number of accepted flashcards) / (total number of generated candidates).
AI Feature Adoption: At least 75% of all newly created flashcards in the system come from the AI generator (and not from manual creation). Measured as (number of flashcards from AI) / (total number of new flashcards).

</prd_planning_summary>

<unresolved_issues>

**Selection and analysis of the SRS library:**
An open-source library (e.g., SuperMemo.NET, fsrs.js) must be definitively chosen, and its API and input data requirements must be analyzed in detail to ensure compatibility.

**Quality risk of the free AI model:**
The quality of flashcards from a free model may be insufficient to achieve the 75% acceptance target. Tests should be conducted with several models, and a contingency plan should be prepared (e.g., lowering the success threshold).

**Design of the "review session" interface:**
The interface and workflow for mass review of flashcards must be designed in detail to be intuitive and effective for the user.

</unresolved_issues>

</conversation_summary>
