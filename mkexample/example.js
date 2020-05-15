// Cambioss
function capitalize(string) 
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function duplicateTemplate(name) {
    const templateId = "19p7PclBxq7ECIherlheGXbVN7QYSwwg7uXg9OAIuGWE";
    const presentation = DriveApp.getFileById(templateId).makeCopy();
    const presentationId = presentation.getId();
  
    presentation.setName(name);
    presentation.setSharing(
      DriveApp.Access.DOMAIN_WITH_LINK,
      DriveApp.Permission.EDIT
    );
  
    return presentationId;
  }
  
  function formatEducation(educationBackground) {
    const formattedEducation = educationBackground.map(function (education) {
      return (
        education.degreeInfo +
        ", " +
        education.description +
        " - " +
        education.institution
      );
    });
    return formattedEducation.join("\n");
  }
  
  function formatEmployment(employmentBackground) {
    const formattedEmployment = employmentBackground.map(function (employment) {
      return (
        employment.description +
        ", " +
        employment.institution +
        formatEmploymentSpan(employment)
      );
    });
  
    return formattedEmployment.join("\n\n");
  }
  
  function formatEmploymentSpan(employment) {
    const start = new Date(employment.startAt);
    const end = new Date(employment.endAt);
  
    if (employment.startAt && employment.endAt) {
      return " (" + asMonthDate(start) + " - " + asMonthDate(end) + ")";
    }
    if (employment.startAt) {
      return " (" + asMonthDate(start) + " - Present)";
    }
    return "";
  }
  
  function asMonthDate(date) {
    return Utilities.formatDate(date, "GMT", "MMMM yyyy");
  }
  
  function formatPastWork(pastWork) {
    const formattedPastWork = pastWork.map(function (work) {
      return work.industry + ": " + work.description;
    });
  
    return formattedPastWork.join("\n\n");
  }
  
  function formatSkills(skills) {
    const formattedSkills = skills.map(function (skill) {
      return "- " + skill.name + " (" + skill.level + ")";
    });
  
    return formattedSkills.join("\n");
  }
  
  function duplicateSlides(presentation, numberOfSlides) {
    const masterSlide = presentation.getSlides()[0];
  
    for (i = 1; i < numberOfSlides; i++) {
      masterSlide.duplicate();
    }
  
    return presentation.getSlides();
  }
  
  function insertLearnMore(slide, public_url) {
    const learnMore = slide.insertTextBox(
      "See online profile",
      630,
      381,
      120,
      30
    );
  
    learnMore
      .getText()
      .getTextStyle()
      .setFontSize(8)
      .setLinkUrl(public_url)
      .setFontFamily("Proxima Nova")
      .setForegroundColor("#8e9288");
  }
  
  function insertAvatar(slide, profile) {
    const defaultAvatarUrl =
      "https://s3-us-west-1.amazonaws.com/avatars.anubis.wizeline.net/f43fdd26dea03e829832493b3c73d5b4.png";
    const avatarUrl = profile.avatarUrl || defaultAvatarUrl;
    try {
      slide.insertImage(avatarUrl, 60, 65, 100, 100);
    } catch (error) {
      Logger.log(
        "Error while trying to insert avatar picture on profile: " +
          profile.id +
          "with error: " +
          error
      );
      slide.insertImage(defaultAvatarUrl, 60, 65, 100, 100);
    }
  }
  
  function populateProfileSlide(slide, profile, public_url) {
    if (profile.jobTitle) {
      slide.replaceAllText("<Position>", capitalize(profile.jobTitle));
    }
    if (profile.name) {
      slide.replaceAllText("<Name>", profile.name);
    }
    if (profile.location) {
      slide.replaceAllText("<Location>", profile.location);
    }
    if (profile.bio) {
      slide.replaceAllText("<Bio>", profile.bio);
    }
    if (profile.education && profile.education.length > 0) {
      slide.replaceAllText("<Education>", formatEducation(profile.education));
    }
    if (profile.experience && profile.experience.length > 0) {
      slide.replaceAllText("<Experience>", formatEmployment(profile.experience));
    }
    if (profile.pastWork && profile.pastWork.length > 0) {
      slide.replaceAllText("<Work>", formatPastWork(profile.pastWork));
    }
    if (profile.skills && profile.skills.length > 0) {
      slide.replaceAllText("<Skills>", formatSkills(profile.skills));
    }
    insertAvatar(slide, profile);
    insertLearnMore(slide, public_url);
  }
  
  function createRosterPresentation(roster) {
    const presentationId = duplicateTemplate(roster.name);
    const presentation = SlidesApp.openById(presentationId);
    const profiles = roster.profiles;
    const slides = duplicateSlides(presentation, profiles.length);
  
    var currentProfile;
    var currentSlide;
  
    for (var i = 0; i < profiles.length; i++) {
      currentProfile = profiles[i];
      currentSlide = slides[i];
      populateProfileSlide(currentSlide, currentProfile, roster.public_url);
    }
  
    return { url: "https://docs.google.com/presentation/d/" + presentationId };
  }
  
  function doPost(event) {
    const roster = JSON.parse(event.postData.contents);
    const presentation = createRosterPresentation(roster);
  
    return ContentService.createTextOutput(
      JSON.stringify(presentation)
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // see https://developers.google.com/apps-script/guides/web
  // to learn more about the input parameter `e` in this method
  function doGet(e) {
    const redirectUri =
      e.parameter["redirect_uri"] || "https://os.wizeline.com/my-rosters";
    return HtmlService.createHtmlOutput(
      "<script>window.open('" + redirectUri + "', '_top')</script>"
    );
  }
  