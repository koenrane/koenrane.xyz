---
permalink: 4-years-of-whoop
publish: "true"
title: "~4 YEARS OF WHOOP: ANALYSIS"
description: Analysis of Whoop data after four years of use. I track sleep, strain, recovery and workouts.
date_published: 2025-03-04
status: in-progress
tags:
  - quantified self
  - biometrics
  - analysis
  - whoop
---

This page is an analysis after using Whoop to track sleep, strain, stress, and numerous other biometrics

At the time of writing this, I have used the Whoop sensor for 1,340 (3.67 yrs) days in succession. 

- There are some gaps in time when the sensor was dead, malfunctioning, not charged, or in a location without power for an extended period.
- The design allows one to easily leave the sensor on the wrist for as long as possible. The most important factor here is that it charges using a removable battery pack. The sensor is also waterproof.
- The mobile app is dense and deep, sometimes requiring a significant amount of time to read metrics. Overall, the app's design is well thought out. Recent updates with Plans can help the user implement some actions instead of passively gathering data. 
- The cost is surprisingly high, and I have not yet justified it, even after 4 years. There are consistent and regular improvements to the Android app and firmware, which is the main reason for keeping the subscription. 
- Even though this is subscription based ([[https://mlemma.medium.com/the-subscription-business-model-is-getting-out-f-cking-control-heres-why-89623a972cd6 | who needs more?]]), I commend the company for providing users with newly released hardware. This is probably the biggest perk of Whoop's model.

# OVERVIEW

---


## NOTES ON QUANTIFIED SELF

---
Quantified Self is about using modern tools to gather information that can be potentially actionable, which in turn has the opportunity to improve your life. It's not necessarily about expensive sensors and complicated apps but about gathering data, testing, and applying changes. These are all preceded by an idea: "What can I do to improve my life?"

If you are like me and wonder about the effects of caffeine and nicotine on sleep and performance, adherence to sleep cycles, supplementing, maintaining a circadian rhythm, ability to recover after a workout, effects of breathwork and meditation, etc, then this is a worthwhile practice. There are numerous questions I have. There is a trap here: adopting protocols that are said to be "magic bullets" or "cheats". Whichever platform you choose to measure biometrics, use that data to do what is right for you. Be willing to make changes and adopt new protocols, but not at the expense of your enjoyment of the process.  

Technically speaking, this can be an empirical study using techniques like linear regression, k-means, anomaly detection, factor analysis, etc. Essentially, the majority of people do not use these techniques manually but view the products of their analysis downstream in applications that visualize trends, anomalies, and predictive outcomes. All of this is not entirely necessary to implement the practice of QS. You could simply use paper and pen to keep a log of how you feel when you wake up and note what your activities were the night before. Over time, you could extrapolate how certain activities might affect mood in the morning. The way you measure should be determined by what you can habitually maintain and is low friction in terms of your available bandwidth. 

It's easy to fall into an obsession with data collection and shove off the analysis and interpretation stage. While many applications can help with this, it doesn't naturally push the average user into understanding the methods used to interpret the data. Instead, companies have integrated [[https://en.wikipedia.org/wiki/Gamification | gamification]], to tap into the competitive nature of society and our obsession with accolades. In many instances, the reward system does produce the intended effect of increased engagement and longer-term play. Although, for myself, I do not care much about the award system.

## METRICS OVERVIEW

---
_Metrics Snapshot at 1,340 Days (2025-03-04)_

**Metric Totals:**

- Level: Platinum Level 22 - 1340 recoveries
- Data Streak: 386 Days
- Total Activities: 581x
- Max Heart Rate: 191
- Peak Day Strain: 20.5

**Streaks:**

- 10+ Strain: 15x
- Green Recovery: 10x
- 70% Sleep: 36x
- Lowest Recovery: 1%
- Longest Hours of Sleep: 12:14

| Activities         | Activities x    | Peak Strain |
| :----------------: | :-------------: | :---------: |
| Weightlifting      |  196x           |  11.7       |
| Functional Fitness |  69x            |  14.2       |
| Manual Labor       |  66x            |  14.8       |
| General            |  65x            |  15.5       |
| Cycling            |  48x            |  18.7       |
| Walking            |  35x            |  9.2        |
| Running            |  33x            |  16.0       |
| Soccer             |   9x            |  15.3       |
| Hiking             |   9x            |  14.5       |
| HIIT               |   7x            |  14.5       |
| Basketball         |   5x            |  9.7        |
| Sauna              |   5x            |  2.2        |
| Ice Bath           |   4x            |  2.2        |
| Snowbaord          |   3x            |  14.0       |
| Pickleball         |   3x            |  14.0       |
| Elliptical         |   3x            |  11.4       |
| Powerlifting       |   3x            |  6.3        |
| Mountain Biking    |   2x            |  8.7        |
| Spin               |   2x            |  8.2        |

# WHOOP 4.0

---
I first saw this product in a video; the details I can't recall, and I thought it was just another Fitbit-type device. I have long been interested in QS as a practice, especially as it pertains to the quality of my sleep. My struggle with it has revealed many notable negative effects in my life overall. A Whoop is primarily a wrist-worn sensor that consists of an optical heart rate sensor that uses green LEDs and photodiodes to capture blood volume under the skin, which measures heart rate and heart rate variability (HRV). The newest version, which I have been using for almost two years, uses additional red and infrared LEDs, a skin temperature sensor, and a pulse oximeter for measuring blood oxygen saturation (SpO2). Via Bluetooth, it transmits data to the Whoop App. There is also a web app, but it's clunky and only has a few features. 

Since the sensor is always working, I figured it would be the best option to get a comprehensive look of general biometrics over time. I started with the 3.0 version, but shortly after the beginning of my subscription, I was upgraded to the 4.0, which is what I used to gather most of my data. The price was a bit hard to swallow, and I lamented being required to sign up for a subscription. On the positive side, signing up for the 12-month plan reduced the cost to about $18 per month. 

Wearing the sensor, after this long, has become an afterthought. It's so light and compact that it's easy to forget you have it on (or put it back on). The straps are thin, stretchable, and quick drying. Recently, I opted for their acquatic band that is slightly thicker and softer. My opinions on the subscription cost also reflect the same sentiment on the cost of their accessories (straps, sleeves, etc). So, I've only purchased one additional strap since I began. I should also note that during workouts, I don't notice it on either, and a plus is that the sensor auto-detects activities. 

## TESTS AND QUESTIONS

---
I've had a backlog of questions and tests I have wanted to run for years. Other than wanting to be informed, I also enjoy extrapolating questions and answers from data. Especially data that can improve performance and general health. Here are some early test ideas I wrote down:

**Initial goal:** track consistent sleep to generate a long-term profile of sleep habits and any negative environmental or personal effects that hinder sleep quality

Questions:

1. how does caffeine affect my sleep?
2. what time should I stop using caffeine?
3. what is the effect of Nicotine on sleep, and how much should I use?
4. how many times do I wake up at night?
5. how much does sleeping with pets in the same room affect my sleep?
6. does reading before bed reduce the time from wake to sleep?

Measurements:

1. measure negative effect of nicotine on daily performance and sleep
2. measure the effect of a difficult workout on next-day recovery
3. analyze sleep results after implementing a bedtime routine (eg. reading, red-light, low-light, cool room)
4. measure the effects of taking the sleep stack (Mg Threonate, Theanine, Apigenin)

## COSTS

---
After years of use, even to this day, the costs are still hard to justify. Again, the free upgrades given upon release of a new generation are a major benefit, but as a whole, it's an investment. Even so, I have not consciously looked for excuses to end the subscription, but after being a long-time user, I feel that I have some grounds for complaint. 
For the 24-month [[https://join.whoop.com/us/en/membership/ | membership]], upfront costs are $399, and the annual is $239. There is also a monthly subscription, which is $30 per month ($360/yr), which is the plan I am currently on. It would make sense to shift over to at least the yearly, but it seems that I am not thrilled about the idea of receiving a $240 bill at the beginning of each year. Upon initial order, their standard band is included, which is what I chose. (Note: the membership is HSA/FSA eligible, which I did not know until very recently)

## ENGINEERING

---
Whoop gathers metrics from a wrist-worn sensor via an optical sensor that produces green light and [[https://en.wikipedia.org/wiki/Photodiode | photodiodes]] that measure the reflected light changes from blood flow. The 4.0 is the result of some reconfigurations of the sensors and some additions that include four photodiodes (light sensors), three green LEDs, infrared, and one red LED. There was a 33% reduction in size from the previous model while introducing more components on the PCB, which can measure [[https://en.wikipedia.org/wiki/Oxygen_saturation_(medicine) | SpO2]] and skin temperature. Whoop boasts that they built the first product in the world to be powered by [[https://www.silanano.com/insights/unlocking-radical-product-innovation-from-the-inside-out | Sila]]'s [[https://pubs.rsc.org/en/content/articlepdf/2024/im/d3im00115f | silicon-anode]] chemistry, which allows for a smaller form factor battery with a 17% higher energy density. 

Measuring SpO2 involves a process called pulse oximetry, where the O2 level of your blood is measured as a percentage (O2 saturation). The inline LEDs shine in two different wavelengths of light through the skin to illuminate the blood vessels. Then, the light is reflected back to the photodiodes. The two wavelength frequencies are separately set to measure oxygenated hemoglobin and non-oxygenated hemoglobin, respectively. The same set of sensors can also measure [[https://www.whoop.com/thelocker/what-are-the-best-pulse-points/ | live heart rate]], [[https://www.whoop.com/thelocker/heart-rate-variability-hrv/ | HRV]], [[https://www.whoop.com/thelocker/resting-heart-rate-by-age-and-gender/ | resting heart rate]], and [[https://www.whoop.com/us/en/thelocker/what-is-respiratory-rate-normal/ | respiratory rate]].  

The unit itself is very lightweight at 11.3 grams, does not contain a screen, and is slightly smaller than the width of my wrist. The clasp and strap design allows you to change or take off the band without having to rethread it. 

The newer battery design allows for charging while immersed in water and is still slideable onto the unit. The difference here is the contactless design of the charging mechanism. Instead of using electromagnetic contacts, the pack charges by connecting wirelessly to the sensor and has an [[https://www.polycase.com/techtalk/ip-rated-enclosures/ip68-vs-ip69.html | IP68 rating]] (immersion beyond 1 meter) for dust proofness and water resistance. 