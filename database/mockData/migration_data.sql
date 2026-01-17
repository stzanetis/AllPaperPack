-- ================================
-- Data Migration Script for New Database Schema
-- ================================
-- This script converts old data structure to the new schema:
-- - Categories: Updated to use integer IDs instead of string IDs
-- - Products: Split into product_bases and product_variants
-- - Tags: Updated with color_hex field (converted from 'color')
-- - Added product_has_tags junction table
-- ================================

-- ================================
-- CATEGORIES
-- ================================
-- Note: IDs changed from string to integer
INSERT INTO "public"."categories" ("id", "name", "description", "parent_id") VALUES 
(1, 'Καθαριστικά Τζαμιών', null, 8),
(2, 'Χαρτικά', 'Είδη Χαρτικών', null),
(3, 'Επαγγελματικά Κουζίνας', null, 2),
(4, 'Είδη Εστίασης', 'Είδη για Εστίαση', null),
(5, 'Κουτιά Πίτσας', null, 4),
(6, 'Πλαστικά Τραπεζομάντηλα', null, 7),
(7, 'Είδη Σπιτιού', 'Προϊόντα για το Σπίτι', null),
(8, 'Καθαριότητα', 'Προϊόντα Καθαριότητας', null),
(9, 'Υγρά Πιάτων', null, 8),
(10, 'Σφουγγάρια Κουζίνας', null, 7),
(11, 'Χειροπετσέτες', null, 2),
(12, 'Ποτήρια Πλαστικά', null, 4);

-- Reset the sequence for categories
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- ================================
-- TAGS
-- ================================
-- Note: 'color' field renamed to 'color_hex'
INSERT INTO "public"."tags" ("id", "name", "description", "color_hex") VALUES 
(1, 'Για Καφέ', 'Προϊόντα που θα χρειαστεί οποιοδήποτε μαγαζί καφέ', '#826945'),
(2, 'Για το Σπίτι', 'Προϊόντα για κάθε σπίτι', '#e1d066'),
(3, 'Για Ταβέρνες', 'Προϊόντα που θα χρειαστεί οποιαδήποτε ταβέρνα', '#a1bc8f'),
(4, 'Για Πιτσαρία', 'Προϊόντα που θα χρειαζόταν οποιαδήποτε πιτσαρία', '#c9745e');

-- Reset the sequence for tags
SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));

-- ================================
-- PRODUCT BASES
-- ================================
-- Note: Products split into bases and variants
-- image_url -> image_path (without https://allpaperpack.gr prefix for local storage)
INSERT INTO "public"."product_bases" ("id", "name", "description", "image_path", "vat", "category_id") VALUES 
(1, 'MAXI ΧΑΡΤΙ ΚΟΥΖΙΝΑΣ ΕΠΑΓ/ΚΟ', 'Επαγγελματικό χαρτί κουζίνας για απαιτητική χρήση.
• Υψηλή απορροφητικότητα
• Ανθεκτικό στο σκίσιμο
• Κατάλληλο για κουζίνες και επαγγελματικούς χώρους
• Πρακτική συσκευασία μεγάλης διάρκειας
Αξιόπιστη καθημερινή λύση.', 'https://allpaperpack.gr/images/MAXI%20%CE%A7%CE%91%CE%A1%CE%A4%CE%99%20%CE%9A%CE%9F%CE%A5%CE%96%CE%99%CE%9D%CE%91%CE%A3%20%CE%95%CE%A0%CE%91%CE%93-%CE%9A%CE%9F%20(6x800gr.)%20-%20(%CE%93%CE%99%CE%91%20%CE%91%CE%A5%CE%A4.%CE%A3%CE%A5%CE%A3%CE%9A%CE%95YH)%20(6106006).jpeg', 24, 3),
(2, 'MAXI ΧΑΡΤΙ ΒΙΟΜΗΧΑΝΙΚΟ ΓΚΟΦΡΕ', 'Βιομηχανικό χαρτί γκοφρέ υψηλής αντοχής.
• Σχεδιασμένο για έντονη χρήση
• Απορροφά υγρά και λίπη
• Ιδανικό για εργαστήρια και χώρους εστίασης
• Οικονομική επιλογή επαγγελματικής ποιότητας.', 'https://allpaperpack.gr/images/MAXI%20%CE%A7%CE%91%CE%A1%CE%A4%CE%99%20%CE%92%CE%99%CE%9F%CE%9C%CE%97%CE%A7%CE%91%CE%9D%CE%99%CE%9A%CE%9F%20%CE%93%CE%9A%CE%9F%CE%A6%CE%A1%CE%95%20(2x2,5kg)%20-%20(%CE%92%CE%9F%CE%92%CE%99%CE%9D%CE%91%20%CE%9C%CE%A0%CE%9B%CE%95)%20(6101032).jpeg', 24, 3),
(3, 'PIZZA ΚΡΑΦΤ BEST IN TOWN', 'Χάρτινο κουτί πίτσας από kraft χαρτί.
• Διατηρεί τη θερμοκρασία
• Ανθεκτικό σε λιπαρότητα
• Κατάλληλο για delivery
• Επαγγελματική εμφάνιση
Ιδανικό για καταστήματα εστίασης.', 'https://allpaperpack.gr/images/PIZZA%20%CE%9A%CE%A1%CE%91%CE%A6%CE%A4%20(BEST%20IN%20TOWN)%20-%20(22x22x4cm)%20-%20100%CF%84%CE%B5%CE%BC.%20-%20(MICROWELLE).jpeg', 24, 5),
(4, 'SANITAS ΣΦΟΥΓΓΑΡΑΚΙ', 'Σφουγγαράκι κουζίνας με αντιβακτηριακή προστασία.
• Αποτελεσματικό στον καθαρισμό
• Ανθεκτικό στη χρήση
• Κατάλληλο για πιάτα και επιφάνειες
Απαραίτητο για καθημερινή καθαριότητα.', 'https://allpaperpack.gr/images/SANITAS%20%CE%A3%CE%A6%CE%9F%CE%A5%CE%93%CE%93%CE%91%CE%A1%CE%91%CE%9A%CE%99%20%CE%9A%CE%9F%CE%A5%CE%96%CE%99%CE%9D%CE%91%CE%A3%20%CE%91%CE%9D%CE%A4%CE%99%CE%92%CE%91%CE%9A%CE%A4-%CE%9A%CE%9F.jpeg', 24, 10),
(5, 'MULTY ΣΠΟΓΓΟΙ ΠΙΑΤΩΝ', 'Σπογγοί πιάτων για καθημερινή χρήση.
• Ισορροπία μαλακής και σκληρής πλευράς
• Αφαιρεί λίπη και υπολείμματα
• Ανθεκτικοί και οικονομικοί
Κατάλληλοι για κάθε κουζίνα.', 'https://allpaperpack.gr/images/MULTY%20%CE%A3%CE%A0%CE%9F%CE%93%CE%93%CE%9F%CE%99%20%CE%A0%CE%99%CE%91%CE%A4%CE%A9%CE%9D%20(%CE%9Do%201026%20-%202%CE%9C).jpeg', 24, 10),
(6, 'FLAMINGO ΤΡΑΠΕΖΟΜΑΝΤΗΛΟ', 'Τραπεζομάντηλο αλέκιαστο για πρακτική χρήση.
• Προστατεύει την επιφάνεια
• Καθαρίζεται εύκολα
• Κατάλληλο για οικιακούς και επαγγελματικούς χώρους
Συνδυάζει λειτουργικότητα και εμφάνιση.', 'https://allpaperpack.gr/images/FLAMINGO%20%CE%A4%CE%A1%CE%91%CE%A0%CE%95%CE%96%CE%9F%CE%9C%CE%91%CE%9D%CE%A4%CE%97%CE%9B%CE%9F%20%CE%91%CE%9B%CE%95%CE%9A%CE%99%CE%91%CE%A3%CE%A4%CE%9F%20-%20(150x150cm).jpeg', 24, 6),
(7, 'CISNE ΣΥΡΜΑ', 'Σύρμα καθαρισμού για σκεύη κουζίνας.
• Αφαιρεί επίμονους λεκέδες
• Ανθεκτικό υλικό
• Κατάλληλο για κατσαρόλες και τηγάνια
Ιδανικό για βαθύ καθαρισμό.', 'https://allpaperpack.gr/images/CISNE%20%CE%A3%CE%A5%CE%A1%CE%9C%CE%91%20%CE%93%CE%99%CE%91%20%CE%A3%CE%9A%CE%95%CE%A5%CE%97%20%CE%9A%CE%9F%CE%A5%CE%96%CE%99%CE%9D%CE%91%CE%A3%2060gr..jpeg', 24, 10),
(8, 'AJAX ΣΦΟΥΓΓΑΡΑΚΙ ΣΑΠΟΥΝΟΥΧΟ', 'Σφουγγαράκια σαπουνιού για εύκολο καθαρισμό.
• Έτοιμα προς χρήση
• Αποτελεσματικά σε λίπη
• Κατάλληλα για καθημερινές εργασίες
Πρακτική λύση καθαριότητας.', 'https://allpaperpack.gr/images/AJAX%20%CE%A3%CE%A6%CE%9F%CE%A5%CE%93%CE%93%CE%91%CE%A1%CE%91%CE%9A%CE%99%20%CE%A3%CE%91%CE%A0%CE%9F%CE%A5%CE%9D%CE%9F%CE%A5%CE%A7%CE%9F%20(7%CF%84%CE%B5%CE%BC.).jpeg', 24, 10),
(9, 'ENDLESS ΧΑΡΤΙ JUMBO ROLL', 'Χαρτί jumbo roll επαγγελματικής ποιότητας.
• Μεγάλη διάρκεια χρήσης
• Υψηλή απορροφητικότητα
• Ιδανικό για επαγγελματικούς χώρους
• Ανθεκτικό και αξιόπιστο.', 'https://allpaperpack.gr/images/ENDLESS%20%CE%A7%CE%91%CE%A1%CE%A4%CE%99%20JUMBO%20ROLL%20%CE%91''%20%CE%A0%CE%9F%CE%99%CE%9F%CE%A4%CE%97%CE%A4%CE%91%20(2x405m)%20-%20(%CE%A7%CE%91%CE%A1%CE%A4%CE%99%20%CE%92%CE%99%CE%9F%CE%9C%CE%97%CE%A7%CE%91%CE%9D%CE%99%CE%9A%CE%9F).jpeg', 24, 3),
(10, 'PIZZA COLOR', 'Χάρτινο κουτί πίτσας με έγχρωμο σχέδιο.
• Ανθεκτικό και πρακτικό
• Διατηρεί τη φρεσκάδα
• Κατάλληλο για μεταφορά
Επαγγελματική επιλογή για delivery.', 'https://allpaperpack.gr/images/PIZZA%20COLOR%20-%20(20x20x4cm)%20-%20100%CF%84%CE%B5%CE%BC.%20-%20(MICROWELLE).jpeg', 24, 5),
(11, 'ΠΑΤΟΣ ΔΙΦΥΛΛΟΣ ΓΙΑ ΚΟΥΤΙ ΠΙΤΣΑΣ', 'Δίφυλλος πάτος για κουτί πίτσας.
• Ενισχυμένη σταθερότητα
• Προστατεύει το προϊόν
• Κατάλληλος για επαγγελματική χρήση
Βελτιώνει την παρουσίαση.', 'https://allpaperpack.gr/images/%CE%A0%CE%91%CE%A4%CE%9F%CE%A3%20%CE%94%CE%99%CE%A6%CE%A5%CE%9B%CE%9B%CE%9F%CE%A3%20%CE%93%CE%99%CE%91%20%CE%9A%CE%9F%CE%A5%CE%A4%CE%99%20%CE%A0%CE%99%CE%A4%CE%A3%CE%91%CE%A3%20(25x25cm)-%20(200%CF%84%CE%B5%CE%BC.).jpeg', 24, 5),
(12, 'PIZZA ΚΡΑΦΤ ΟΙΚΟΓΕΝΕΙΑΚΟ', 'Μεγάλο κουτί πίτσας από kraft χαρτί.
• Ανθεκτικό στη θερμότητα
• Κατάλληλο για οικογενειακές πίτσες
• Ιδανικό για delivery
Πρακτική και επαγγελματική λύση.', 'https://allpaperpack.gr/images/PIZZA%20%CE%9A%CE%A1%CE%91%CE%A6%CE%A4%20(ITS%20PIZZA%20TIME)%20-%20(36x36x4cm)%20-%20100%CF%84%CE%B5%CE%BC.%20-%20(MICROWELLE).jpeg', 24, 5),
(13, 'ΠΟΤΗΡΙ FREDDO', 'Ποτήρι freddo για κρύα ροφήματα.
• Σταθερή κατασκευή
• Ιδανικό για καφέ και αναψυκτικά
• Κατάλληλο για takeaway
Λειτουργικό και κομψό.', 'https://allpaperpack.gr/images/%CE%A0%CE%9F%CE%A4%CE%97%CE%A1%CE%99%20FREDDO%20300ml%20(No%20504)%20-%20(50%CF%84%CE%B5%CE%BC.)%20(%CE%9C%CE%91%CE%A5%CE%A1%CE%9F)%20(LUX%20PLAST).jpeg', 24, 12),
(14, 'ΠΟΤΗΡΙ ΤΥΠΩΜΕΝΟ COFFEE', 'Τυπωμένο ποτήρι καφέ για επαγγελματική χρήση.
• Ανθεκτικό υλικό
• Κατάλληλο για ζεστά ροφήματα
• Επαγγελματική εμφάνιση
Ιδανικό για καφετέριες.', 'https://allpaperpack.gr/images/%CE%A0%CE%9F%CE%A4%CE%97%CE%A1%CE%99%20%CE%A4%CE%A5%CE%A0%CE%A9%CE%9C%CE%95%CE%9D%CE%9F%20COFFEE%20300ml%20-%20(50%CF%84%CE%B5%CE%BC.)%20(%CE%98%CE%A1%CE%91%CE%9A%CE%97%CE%A3)%20(ART95-300).jpeg', 24, 12),
(15, 'OKI DOKI ΠΛΑΣΤΙΚΟ ΠΟΤΗΡΙ', 'Πλαστικό ποτήρι διαφανές.
• Κατάλληλο για κρύα ροφήματα
• Ελαφρύ και πρακτικό
• Ιδανικό για εκδηλώσεις
Οικονομική επιλογή.', 'https://allpaperpack.gr/images/OKI%20DOKI%20%CE%A0%CE%9B%CE%91%CE%A3%CE%A4%CE%99%CE%9A%CE%9F%20%CE%A0%CE%9F%CE%A4%CE%97%CE%A1%CE%99%20240ml%20(50%CF%84%CE%B5%CE%BC.)%20-%20(%CE%94%CE%99%CE%91%CE%A6%CE%91%CE%9D%CE%9F).jpeg', 24, 12),
(16, 'ΠΛΑΣΤΙΚΟ ΦΛΥΤΖΑΝΑΚΙ', 'Πλαστικό φλυτζανάκι με χερούλι.
• Άνετο στη χρήση
• Κατάλληλο για ζεστά ροφήματα
• Σταθερή κατασκευή
Ιδανικό για επαγγελματικούς χώρους.', 'https://allpaperpack.gr/images/%CE%A0%CE%9B%CE%91%CE%A3%CE%A4%CE%99%CE%9A%CE%9F%20%CE%A6%CE%9B%CE%A5%CE%A4%CE%96%CE%91%CE%9D%CE%91%CE%9A%CE%99%2080ml%20-%20(50%CF%84%CE%B5%CE%BC.)%20(%CE%9C%CE%95%20%CE%A7%CE%95%CE%A1%CE%9F%CE%A5%CE%9B%CE%99).jpeg', 24, 12),
(17, 'PROSOFT ΧΑΡΤΙ ΚΟΥΖΙΝΑΣ', 'Επαγγελματικό χαρτί κουζίνας μεγάλης αντοχής.
• Υψηλή απορροφητικότητα
• Κατάλληλο για έντονη χρήση
• Πρακτική και αξιόπιστη λύση
Ιδανικό για κουζίνες.', 'https://allpaperpack.gr/images/PROSOFT%20%CE%A7%CE%91%CE%A1%CE%A4%CE%99%20%CE%9A%CE%9F%CE%A5%CE%96%CE%99%CE%9D%CE%91%CE%A3%20%CE%95%CE%A0%CE%91%CE%93%CE%93%CE%95%CE%9B%CE%9C%CE%91%CE%A4%CE%99%CE%9A%CE%9F%201000gr.%20-%20(6106199).jpeg', 24, 3),
(18, 'ENDLESS ΧΕΙΡΟΠΕΤΣΕΤΑ ΖΙΚ-ΖΑΚ', 'Χειροπετσέτες ζικ-ζακ για επαγγελματική χρήση.
• Εύκολη διάθεση
• Υψηλή απορροφητικότητα
• Κατάλληλες για χώρους υγιεινής
Πρακτική λύση καθημερινότητας.', 'https://allpaperpack.gr/images/ENDLESS%20%CE%A7%CE%95%CE%99%CE%A1%CE%9F%CE%A0%CE%95%CE%A4%CE%A3%CE%95%CE%A4%CE%91%20%CE%96%CE%99%CE%9A-%CE%96%CE%91%CE%9A%201%20%CF%86%CF%8D%CE%BB%CE%BB%CE%BF%20-%20(20x200%CF%84%CE%B5%CE%BC.).jpeg', 24, 11),
(19, 'ENDLESS ΧΕΙΡΟΠΕΤΣΕΤΑ ΡΟΛΟ', 'Χειροπετσέτες ρολού για επαγγελματικούς χώρους.
• Μεγάλη χωρητικότητα
• Ανθεκτικές και απορροφητικές
• Κατάλληλες για έντονη χρήση
Αξιόπιστη επιλογή.', 'https://allpaperpack.gr/images/ENDLESS%20%CE%A7%CE%95%CE%99%CE%A1%CE%9F%CE%A0%CE%95%CE%A4%CE%A3%CE%95%CE%A4%CE%91%20%CE%A1%CE%9F%CE%9B%CE%9F%20%CE%9C%CE%A0%CE%9B%CE%95%20-%20(6x800%CF%84%CE%B5%CE%BC.).jpeg', 24, 11),
(20, 'SAM ΧΕΙΡΟΠΕΤΣΕΤΑ', 'Χειροπετσέτες υψηλής χωρητικότητας.
• Ιδανικές για επαγγελματική χρήση
• Υψηλή απορροφητικότητα
• Κατάλληλες για χώρους υγιεινής
Πρακτική και οικονομική λύση.', 'https://allpaperpack.gr/images/SAM%20%CE%A7%CE%95%CE%99%CE%A1%CE%9F%CE%A0%CE%A5%CE%A4%CE%A3%CE%95%CE%A4%CE%91%201%CE%A6%20(25x19cm)%20-%20(4000%20%CE%A6%CE%A5%CE%9B%CE%9B%CE%91)%20(%CE%9C%CE%A0%CE%9B%CE%95).jpeg', 24, 11),
(21, 'SAVE PLUS ΧΕΙΡΟΠΕΤΣΕΤΑ', 'Χειροπετσέτες πολλαπλών τεμαχίων.
• Εύκολη αποθήκευση
• Ανθεκτικό χαρτί
• Κατάλληλες για επαγγελματικούς χώρους
Σταθερή ποιότητα.', 'https://allpaperpack.gr/images/SAVE%20PLUS%20%CE%A7%CE%95%CE%99%CE%A1%CE%9F%CE%A0%CE%95%CE%A4%CE%A3%CE%95%CE%A4%CE%91%20(21.5x18cm)%20-%20(18x175%CF%84%CE%B5%CE%BC.)%20(7211S).jpeg', 24, 11),
(22, 'ΔΙΣΚΟΠΑΝΑ', 'Δισκόπανα για καθαριότητα και σερβίρισμα.
• Πολλαπλών χρήσεων
• Ανθεκτικά και πρακτικά
• Κατάλληλα για επαγγελματική χρήση
Ιδανικά για κουζίνες.', 'https://allpaperpack.gr/images/%CE%94%CE%99%CE%A3%CE%9A%CE%9F%CE%A0%CE%91%CE%9D%CE%91%2012%CF%84%CE%B5%CE%BC.%20-%20(CROCHET)%20(30x45cm).jpeg', 24, 7),
(23, 'ΤΡΑΠΕZΟΜΑΝΤΗΛΟ ΗΜΙΔΙΑΦΑΝΟ', 'Ημιδιαφανές τραπεζομάντηλο.
• Προστατεύει την επιφάνεια
• Καθαρίζεται εύκολα
• Κατάλληλο για καθημερινή χρήση
Απλό και πρακτικό.', 'https://allpaperpack.gr/images/%CE%A4%CE%A1%CE%91%CE%A0EZOMANTH%CE%9BO%20%CE%97%CE%9C%CE%99%CE%94%CE%99%CE%91%CE%A6%CE%91%CE%9D%CE%9F%20(132R).jpeg', 24, 6),
(24, 'ΤΡΑΠΕΖΟΜΑΝΤΗΛΟ ΜΟΥΣΑΜΑ', 'Τραπεζομάντηλο μουσαμά.
• Ανθεκτικό και εύχρηστο
• Κατάλληλο για καθημερινή χρήση
• Προστασία επιφανειών
Οικονομική λύση.', 'https://allpaperpack.gr/images/%CE%A4%CE%A1%CE%91%CE%A0%CE%95%CE%96%CE%9F%CE%9C%CE%91%CE%9D%CE%A4%CE%97%CE%9B%CE%9F%20%CE%A7%CE%9D%CE%9F%CE%A5%CE%94%CE%99%20%CE%9C%CE%9F%CE%A5%CE%A3%CE%91%CE%9C%CE%91%20(140%20R).jpeg', 24, 6),
(25, 'AVA PERLE ΠΙΑΤΩΝ', 'Υγρό πιάτων με άρωμα χαμομήλι και λεμόνι.
• Αφαιρεί λίπη
• Φιλικό στη χρήση
• Κατάλληλο για καθημερινό πλύσιμο
Αποτελεσματικός καθαρισμός.', 'https://allpaperpack.gr/images/AVA%20PERLE%20%CE%A0%CE%99%CE%91%CE%A4%CE%A9%CE%9D%20%20430ml%20-%20(%CE%A7%CE%91%CE%9C%CE%9F%CE%9C%CE%97%CE%9B%CE%99%20&%20%CE%9B%CE%95%CE%9C%CE%9F%CE%9D%CE%99).jpeg', 24, 9),
(26, 'AXION ΣΥΜΠ/ΝΟ ΥΓΡΟ ΠΙΑΤΩΝ', 'Συμπυκνωμένο υγρό πιάτων μεγάλης χωρητικότητας.
• Ισχυρό κατά των λιπών
• Οικονομική χρήση
• Κατάλληλο για επαγγελματικές κουζίνες
Υψηλή απόδοση.', 'https://allpaperpack.gr/images/AXION%20%CE%A3%CE%A5%CE%9C%CE%A0-%CE%9D%CE%9F%20%CE%A5%CE%93%CE%A1%CE%9F%20%CE%A0%CE%99%CE%91%CE%A4%CE%A9%CE%9D%204lit%20-%20(%CE%9B%CE%95%CE%9C%CE%9F%CE%9D%CE%91%CE%9D%CE%98%CE%9F%CE%99).jpeg', 24, 9),
(27, 'BUBBLE ΥΓΡΟ ΠΙΑΤΩΝ', 'Υγρό πιάτων γενικής χρήσης.
• Καθαρίζει αποτελεσματικά
• Κατάλληλο για καθημερινή χρήση
• Οικονομική επιλογή
Ιδανικό για οικιακές και επαγγελματικές ανάγκες.', 'https://allpaperpack.gr/images/BUBBLE%20%CE%A5%CE%93%CE%A1%CE%9F%20%CE%A0%CE%99%CE%91%CE%A4%CE%A9%CE%9D%204lit%20-%20(%CE%A0%CE%A1%CE%91%CE%A3%CE%99%CE%9D%CE%9F-%CE%9B%CE%95%CE%9C%CE%9F%CE%9D%CE%99).jpeg', 24, 9),
(28, 'ENDLESS ΥΓΡΟ ΠΙΑΤΩΝ', 'Υγρό πιάτων με άρωμα άγριου βατόμουρου.
• Αφαιρεί λίπη
• Ευχάριστο άρωμα
• Κατάλληλο για καθημερινή χρήση
Αποτελεσματικός καθαρισμός.', 'https://allpaperpack.gr/images/ENDLESS%20%CE%A5%CE%93%CE%A1%CE%9F%20%CE%A0%CE%99%CE%91%CE%A4%CE%A9%CE%9D%20500ml%20-%20(%CE%91%CE%93%CE%A1%CE%99%CE%9F%20%CE%92%CE%91%CE%A4%CE%9F%CE%9C%CE%9F%CE%A5%CE%A1%CE%9F).jpeg', 24, 9),
(29, 'AJAX ΤΖΑΜΙΩΝ CLASSIC', 'Καθαριστικό τζαμιών με αντλία.
• Αφήνει επιφάνειες χωρίς στίγματα
• Εύκολο στη χρήση
• Κατάλληλο για τζάμια και καθρέφτες
Καθαρό αποτέλεσμα.', 'https://allpaperpack.gr/images/AJAX%20%CE%A4%CE%96%CE%91%CE%9C%CE%99%CE%A9%CE%9D%20CLASSIC%20%CE%91%CE%9D%CE%A4%CE%9B%CE%99%CE%91%20500ml.jpeg', 24, 1),
(30, 'AJAX ΤΖΑΜΙΩΝ ΑΝΤΑΛΛΑΚΤΙΚΟ', 'Ανταλλακτικό καθαριστικού τζαμιών.
• Οικονομική λύση
• Αποτελεσματικό στον καθαρισμό
• Κατάλληλο για γυάλινες επιφάνειες
Πρακτική επιλογή.', 'https://allpaperpack.gr/images/AJAX%20%CE%A4%CE%96%CE%91%CE%9C%CE%99%CE%A9%CE%9D%20%CE%91%CE%9D%CE%A4%CE%91%CE%9B%CE%9B%CE%91%CE%9A%CE%A4%CE%99%CE%9A%CE%9F%20750ml%20-%20(%CE%A1%CE%9F%CE%94%CE%9F%20%CE%91%CE%A5%CE%93%CE%97%CE%A3).jpeg', 24, 1),
(31, 'FLOS VERO ΤΖΑΜΙΩΝ', 'Καθαριστικό τζαμιών με ξύδι.
• Αφαιρεί λεκέδες
• Αφήνει γυαλάδα
• Κατάλληλο για καθημερινή χρήση
Αξιόπιστο αποτέλεσμα.', 'https://allpaperpack.gr/images/FLOS%20VERO%20%CE%A4%CE%96%CE%91%CE%9C%CE%99%CE%A9%CE%9D%20%CE%9C%CE%95%20%CE%9E%CE%A5%CE%94%CE%99%20750ml%20-%20(%CE%91%CE%9D%CE%A4%CE%9B%CE%99%CE%91)%20(%CE%9C%CE%A0%CE%9B%CE%95).jpeg', 24, 1),
(32, 'ΕΥΡΗΚΑ ΤΖΑΜΙΩΝ', 'Καθαριστικό τζαμιών με ψεκαστήρα.
• Κρυστάλλινη καθαριότητα
• Εύκολο στη χρήση
• Ιδανικό για γυάλινες επιφάνειες
Καθαρό και λαμπερό αποτέλεσμα.', 'https://allpaperpack.gr/images/%CE%95%CE%A5%CE%A1%CE%97%CE%9A%CE%91%20%CE%A4%CE%96%CE%91%CE%9C%CE%99%CE%A9%CE%9D%20750ml%20-%20(CRYSTAL)%20(%CE%A8%CE%95%CE%9A%CE%91%CE%A3%CE%A4H%CE%A1%CE%99).jpeg', 24, 1);

-- Reset the sequence for product_bases
SELECT setval('product_bases_id_seq', (SELECT MAX(id) FROM product_bases));

-- ================================
-- PRODUCT VARIANTS
-- ================================
-- Each product now has a single "Κανονικό" variant with the original price and stock
INSERT INTO "public"."product_variants" ("base_id", "variant_name", "unit_price", "stock") VALUES 
(1, 'Κανονικό', 18.00, 5),
(2, 'Κανονικό', 10.00, 44),
(3, 'Κανονικό', 9.00, 3),
(4, 'Κανονικό', 0.08, 81),
(5, 'Κανονικό', 0.12, 600),
(6, 'Κανονικό', 8.00, 15),
(7, 'Κανονικό', 1.80, 2),
(8, 'Κανονικό', 0.45, 123),
(9, 'Κανονικό', 14.00, 22),
(10, 'Κανονικό', 9.50, 12),
(11, 'Κανονικό', 11.00, 7),
(12, 'Κανονικό', 21.00, 15),
(13, 'Κανονικό', 0.50, 107),
(14, 'Κανονικό', 1.20, 25),
(15, 'Κανονικό', 0.25, 65),
(16, 'Κανονικό', 3.05, 12),
(17, 'Κανονικό', 4.00, 5),
(18, 'Κανονικό', 12.00, 78),
(19, 'Κανονικό', 25.00, 1),
(20, 'Κανονικό', 29.00, 0),
(21, 'Κανονικό', 15.00, 8),
(22, 'Κανονικό', 3.00, 22),
(23, 'Κανονικό', 3.56, 4),
(24, 'Κανονικό', 1.34, 34),
(25, 'Κανονικό', 2.30, 20),
(26, 'Κανονικό', 3.56, 3),
(27, 'Κανονικό', 3.00, 9),
(28, 'Κανονικό', 1.22, 12),
(29, 'Κανονικό', 12.00, 3),
(30, 'Κανονικό', 1.57, 3),
(31, 'Κανονικό', 12.00, 12),
(32, 'Κανονικό', 5.75, 35);

-- ================================
-- PRODUCT_HAS_TAGS (Junction Table)
-- ================================
-- Mapping products to tags based on logical relationships:
-- Tag 1 (Για Καφέ): Coffee-related products
-- Tag 2 (Για το Σπίτι): Household products
-- Tag 3 (Για Ταβέρνες): Tavern/restaurant products
-- Tag 4 (Για Πιτσαρία): Pizza shop products

INSERT INTO "public"."product_has_tags" ("base_id", "tag_id") VALUES
-- Για Καφέ (Coffee shops)
(13, 1), -- ΠΟΤΗΡΙ FREDDO
(14, 1), -- ΠΟΤΗΡΙ ΤΥΠΩΜΕΝΟ COFFEE
(15, 1), -- OKI DOKI ΠΛΑΣΤΙΚΟ ΠΟΤΗΡΙ
(16, 1), -- ΠΛΑΣΤΙΚΟ ΦΛΥΤΖΑΝΑΚΙ
(18, 1), -- ENDLESS ΧΕΙΡΟΠΕΤΣΕΤΑ ΖΙΚ-ΖΑΚ
(1, 1),  -- MAXI ΧΑΡΤΙ ΚΟΥΖΙΝΑΣ

-- Για το Σπίτι (Home)
(4, 2),  -- SANITAS ΣΦΟΥΓΓΑΡΑΚΙ
(5, 2),  -- MULTY ΣΠΟΓΓΟΙ ΠΙΑΤΩΝ
(6, 2),  -- FLAMINGO ΤΡΑΠΕΖΟΜΑΝΤΗΛΟ
(7, 2),  -- CISNE ΣΥΡΜΑ
(8, 2),  -- AJAX ΣΦΟΥΓΓΑΡΑΚΙ ΣΑΠΟΥΝΟΥΧΟ
(22, 2), -- ΔΙΣΚΟΠΑΝΑ
(23, 2), -- ΤΡΑΠΕZΟΜΑΝΤΗΛΟ ΗΜΙΔΙΑΦΑΝΟ
(24, 2), -- ΤΡΑΠΕΖΟΜΑΝΤΗΛΟ ΜΟΥΣΑΜΑ
(25, 2), -- AVA PERLE ΠΙΑΤΩΝ
(27, 2), -- BUBBLE ΥΓΡΟ ΠΙΑΤΩΝ
(28, 2), -- ENDLESS ΥΓΡΟ ΠΙΑΤΩΝ
(29, 2), -- AJAX ΤΖΑΜΙΩΝ CLASSIC
(30, 2), -- AJAX ΤΖΑΜΙΩΝ ΑΝΤΑΛΛΑΚΤΙΚΟ
(31, 2), -- FLOS VERO ΤΖΑΜΙΩΝ
(32, 2), -- ΕΥΡΗΚΑ ΤΖΑΜΙΩΝ

-- Για Ταβέρνες (Taverns)
(1, 3),  -- MAXI ΧΑΡΤΙ ΚΟΥΖΙΝΑΣ
(2, 3),  -- MAXI ΧΑΡΤΙ ΒΙΟΜΗΧΑΝΙΚΟ
(9, 3),  -- ENDLESS ΧΑΡΤΙ JUMBO ROLL
(17, 3), -- PROSOFT ΧΑΡΤΙ ΚΟΥΖΙΝΑΣ
(19, 3), -- ENDLESS ΧΕΙΡΟΠΕΤΣΕΤΑ ΡΟΛΟ
(20, 3), -- SAM ΧΕΙΡΟΠΕΤΣΕΤΑ
(21, 3), -- SAVE PLUS ΧΕΙΡΟΠΕΤΣΕΤΑ
(22, 3), -- ΔΙΣΚΟΠΑΝΑ
(26, 3), -- AXION ΣΥΜΠ/ΝΟ ΥΓΡΟ ΠΙΑΤΩΝ

-- Για Πιτσαρία (Pizza shops)
(3, 4),  -- PIZZA ΚΡΑΦΤ BEST IN TOWN
(10, 4), -- PIZZA COLOR
(11, 4), -- ΠΑΤΟΣ ΔΙΦΥΛΛΟΣ
(12, 4), -- PIZZA ΚΡΑΦΤ ΟΙΚΟΓΕΝΕΙΑΚΟ
(1, 4),  -- MAXI ΧΑΡΤΙ ΚΟΥΖΙΝΑΣ
(2, 4),  -- MAXI ΧΑΡΤΙ ΒΙΟΜΗΧΑΝΙΚΟ
(13, 4), -- ΠΟΤΗΡΙ FREDDO (for drinks with pizza)
(15, 4); -- OKI DOKI ΠΛΑΣΤΙΚΟ ΠΟΤΗΡΙ

-- ================================
-- NOTES:
-- ================================
-- 1. Products are now split into product_bases (general info) and product_variants (price/stock per variant)
-- 2. Each product has one "Κανονικό" (Standard) variant by default
-- 3. Category IDs changed from string (UUID) to integer (SERIAL)
-- 4. Tags now have color_hex field instead of color
-- 5. Product-to-tag relationships are stored in product_has_tags junction table
-- 6. Image URLs are preserved as-is (external URLs from allpaperpack.gr)
-- 7. VAT values are stored as integers (24 = 24%)
-- 8. All sequences are reset to match the maximum ID values
